import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin-only: force sync + diagnose any user
// Call: POST /api/admin/force-sync { userId }
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const report: Record<string, any> = { userId };

  // 1. Check profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, plaid_access_token, monthly_income, is_pro")
    .eq("id", userId)
    .single();

  report.profile = {
    found: !!profile,
    has_token: !!profile?.plaid_access_token,
    is_pro: profile?.is_pro,
    monthly_income: profile?.monthly_income,
    error: profileErr?.message,
  };

  if (!profile?.plaid_access_token) {
    report.diagnosis = "No plaid_access_token  -  bank was never connected or token save failed";
    return NextResponse.json(report);
  }

  // 2. Count existing data
  const [txCount, recurCount, itemCount] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("recurring_transactions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  report.existing_data = {
    transactions: txCount.count ?? 0,
    recurring_transactions: recurCount.count ?? 0,
    items: itemCount.count ?? 0,
  };

  // 3. Force sync via our own sync route
  const syncRes = await fetch(`${req.nextUrl.origin}/api/plaid/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const syncBody = await syncRes.json().catch(() => ({}));
  report.sync_result = { status: syncRes.status, ...syncBody };

  // 4. Counts after sync
  const [txCount2, recurCount2, itemCount2] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("recurring_transactions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  report.after_sync = {
    transactions: txCount2.count ?? 0,
    recurring_transactions: recurCount2.count ?? 0,
    items: itemCount2.count ?? 0,
  };

  // 5. Diagnosis
  if (syncBody?.error_code === "PRODUCT_NOT_READY") {
    report.diagnosis = "PRODUCT_NOT_READY  -  Plaid is still processing this bank. Wait 2-5 minutes and try again.";
  } else if (syncBody?.error_code === "ITEM_LOGIN_REQUIRED") {
    report.diagnosis = "ITEM_LOGIN_REQUIRED  -  user needs to reconnect their bank.";
  } else if (syncBody?.synced === 0 && syncBody?.recurring === 0) {
    report.diagnosis = "Sync ran but Plaid returned 0 transactions and 0 recurring. Bank may be newly connected or empty.";
  } else if ((itemCount2.count ?? 0) === 0 && (recurCount2.count ?? 0) > 0) {
    report.diagnosis = "recurring_transactions exist but no items were created  -  check auto-insert step in sync route.";
  } else {
    report.diagnosis = "Sync completed. Check after_sync counts above.";
  }

  return NextResponse.json(report, { status: 200 });
}
