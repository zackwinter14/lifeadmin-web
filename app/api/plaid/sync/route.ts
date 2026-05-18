import { NextRequest, NextResponse } from "next/server";
import { PlaidApi, PlaidEnvironments, Configuration } from "plaid";
import { createClient } from "@supabase/supabase-js";

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || "production"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
}));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INCOME_CATEGORY_KEYWORDS = [
  "payroll", "direct dep", "direct deposit", "salary", "wages", "wage",
  "adp", "gusto", "paychex", "workday", "bamboohr", "zenefits",
  "intuit payroll", "quickbooks payroll", "square payroll",
  "income", "compensation", "earnings",
];

const EXCLUDE_KEYWORDS = [
  "transfer", "zelle", "venmo", "cashapp", "cash app", "paypal",
  "refund", "return", "credit", "reimburse", "reimbursement",
  "interest", "dividend", "cashback", "reward", "bonus point",
  "atm", "withdrawal",
];

function isLikelyPayroll(txn: any): boolean {
  const name = (txn.name || txn.merchant_name || "").toLowerCase();
  const cats: string[] = (txn.personal_finance_category?.detailed || txn.category || [])
    .map((c: string) => c.toLowerCase());

  if (EXCLUDE_KEYWORDS.some(kw => name.includes(kw))) return false;

  const pfcPrimary = (txn.personal_finance_category?.primary || "").toLowerCase();
  if (pfcPrimary === "income") return true;

  const catStr = cats.join(" ");
  if (catStr.includes("payroll") || catStr.includes("income") || catStr.includes("wages")) return true;

  if (INCOME_CATEGORY_KEYWORDS.some(kw => name.includes(kw))) return true;

  return false;
}

function detectIncome(transactions: any[]): number {
  const credits = transactions.filter(t => t.amount < 0 && Math.abs(t.amount) > 200);
  const payrollTxns = credits.filter(isLikelyPayroll);
  const pool = payrollTxns.length > 0 ? payrollTxns : credits;

  if (pool.length === 0) return 0;

  const groups: Record<number, { amounts: number[]; dates: string[] }> = {};
  pool.forEach(t => {
    const rounded = Math.round(Math.abs(t.amount) / 50) * 50;
    if (!groups[rounded]) groups[rounded] = { amounts: [], dates: [] };
    groups[rounded].amounts.push(Math.abs(t.amount));
    groups[rounded].dates.push(t.date);
  });

  const recurring = Object.values(groups)
    .filter(g => {
      if (g.amounts.length < 2) return false;
      const sorted = [...g.dates].sort();
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        gaps.push(diff);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return avgGap >= 6 && avgGap <= 35;
    })
    .map(g => {
      const avg = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length;
      const sorted = [...g.dates].sort();
      const gap = (new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()) / 86400000 / (sorted.length - 1);
      if (gap <= 9) return avg * (52 / 12);
      if (gap <= 18) return avg * (26 / 12);
      return avg;
    });

  if (recurring.length > 0) return Math.round(Math.max(...recurring));

  const sorted = pool.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return Math.round(Math.abs(sorted[0].amount));
}

function plaidErrorCode(e: any): string | null {
  return e?.response?.data?.error_code ?? null;
}

function plaidErrorMessage(e: any): string {
  return e?.response?.data?.error_message ?? e?.message ?? "Unknown error";
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plaid_access_token")
    .eq("id", userId)
    .single();

  if (!profile?.plaid_access_token) {
    return NextResponse.json({ error: "No bank connected" }, { status: 400 });
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Step 1: fetch transactions — each error code gets a specific response
  let transactions: any[] = [];
  try {
    const txRes = await plaid.transactionsGet({
      access_token: profile.plaid_access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    });
    transactions = txRes.data.transactions;
  } catch (e: any) {
    const code = plaidErrorCode(e);
    const msg = plaidErrorMessage(e);
    console.error("Plaid transactionsGet error:", code, msg);

    if (code === "ITEM_LOGIN_REQUIRED") {
      return NextResponse.json({ error: "reconnect_required", error_code: code }, { status: 400 });
    }
    if (code === "PRODUCT_NOT_READY") {
      return NextResponse.json({
        error: "Bank data is still loading. Wait a moment then try again.",
        error_code: code,
      }, { status: 202 });
    }
    // Return the actual Plaid error so we can see what's happening
    return NextResponse.json({ error: msg, error_code: code ?? "PLAID_ERROR" }, { status: 500 });
  }

  // Step 2: upsert transactions (sign-flipped: expenses stored as negative)
  let stored = 0;
  try {
    const rows = transactions.map(t => ({
      user_id: userId,
      plaid_transaction_id: t.transaction_id,
      merchant_name: t.merchant_name || t.name,
      clean_merchant_name: t.merchant_name || t.name,
      amount: -t.amount,
      date: t.date,
      category: t.personal_finance_category?.primary || t.category?.[0] || null,
    }));
    if (rows.length > 0) {
      const { error } = await supabase
        .from("transactions")
        .upsert(rows, { onConflict: "plaid_transaction_id" });
      if (error) console.error("transactions upsert error:", error.message);
      else stored = rows.length;
    }
  } catch (e: any) {
    console.error("transactions upsert exception:", e?.message);
  }

  // Step 3: populate recurring_transactions from Plaid's stream detector
  let recurringCount = 0;
  try {
    const recurringRes = await plaid.transactionsRecurringGet({
      access_token: profile.plaid_access_token,
      options: {},
    });
    const outflowStreams = recurringRes.data.outflow_streams || [];
    await supabase.from("recurring_transactions").delete().eq("user_id", userId);
    const recurringRows = outflowStreams
      .filter((s: any) => s.is_active && s.status !== "TOMBSTONED")
      .map((s: any) => ({
        user_id: userId,
        merchant_name: s.merchant_name || s.description,
        clean_merchant_name: s.merchant_name || s.description,
        average_amount: Math.abs(s.average_amount?.amount ?? 0),
        last_amount: Math.abs(s.last_amount?.amount ?? 0),
        frequency: s.frequency,
        category: s.category?.[0] ?? null,
        is_active: true,
      }));
    if (recurringRows.length > 0) {
      await supabase.from("recurring_transactions").insert(recurringRows);
      recurringCount = recurringRows.length;
    }
  } catch (e: any) {
    // Not fatal — recurring detection may not be available for all accounts/environments
    console.error("transactionsRecurringGet skipped:", plaidErrorCode(e) ?? e?.message);
  }

  // Step 4: income detection (runs on raw Plaid amounts before sign flip)
  const income = detectIncome(transactions);
  if (income > 0) {
    await supabase.from("profiles").upsert({ id: userId, monthly_income: income });
  }

  return NextResponse.json({
    synced: transactions.length,
    stored,
    recurring: recurringCount,
    income,
    synced_at: new Date().toISOString(),
  });
}
