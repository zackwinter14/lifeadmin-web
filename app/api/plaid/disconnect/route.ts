import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  await Promise.all([
    supabase.from("profiles").update({ plaid_access_token: null }).eq("id", userId),
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("recurring_transactions").delete().eq("user_id", userId),
    supabase.from("items").delete().eq("user_id", userId).eq("source", "detected"),
  ]);

  return NextResponse.json({ success: true });
}
