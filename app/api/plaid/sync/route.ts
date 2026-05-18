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

export async function POST(req: NextRequest) {
  try {
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

    const txRes = await plaid.transactionsGet({
      access_token: profile.plaid_access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    });

    const transactions = txRes.data.transactions;

    // Upsert transactions — ignore failures if schema differs
    try {
      const rows = transactions.map(t => ({
        user_id: userId,
        plaid_transaction_id: t.transaction_id,
        merchant_name: t.merchant_name || t.name,
        clean_merchant_name: t.merchant_name || t.name,
        amount: t.amount,
        date: t.date,
        category: t.personal_finance_category?.primary || t.category?.[0] || null,
      }));
      if (rows.length > 0) {
        await supabase.from("transactions").upsert(rows, { onConflict: "plaid_transaction_id" });
      }
    } catch {}

    // Re-run income detection
    const income = detectIncome(transactions);
    if (income > 0) {
      await supabase.from("profiles").upsert({ id: userId, monthly_income: income });
    }

    return NextResponse.json({
      synced: transactions.length,
      income,
      synced_at: new Date().toISOString(),
    });
  } catch (e: any) {
    const plaidError = e?.response?.data;
    const errorCode = plaidError?.error_code;
    console.error("Plaid sync error:", plaidError || e);

    // Surface ITEM_LOGIN_REQUIRED so the client can prompt reconnect
    if (errorCode === "ITEM_LOGIN_REQUIRED") {
      return NextResponse.json({ error: "reconnect_required", error_code: errorCode }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
