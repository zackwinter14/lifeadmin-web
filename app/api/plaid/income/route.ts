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

function detectIncome(transactions: any[]): number {
  // Credits in Plaid have negative amounts (money coming in)
  const credits = transactions.filter(t => t.amount < 0 && Math.abs(t.amount) > 200);

  // Group by rounded amount to find recurring deposits
  const groups: Record<number, number[]> = {};
  credits.forEach(t => {
    const rounded = Math.round(Math.abs(t.amount) / 50) * 50;
    if (!groups[rounded]) groups[rounded] = [];
    groups[rounded].push(Math.abs(t.amount));
  });

  // Find amounts that appear 2+ times in 90 days (roughly monthly)
  const recurring = Object.entries(groups)
    .filter(([, amounts]) => amounts.length >= 2)
    .map(([, amounts]) => amounts.reduce((a, b) => a + b, 0) / amounts.length);

  if (recurring.length === 0) {
    // Fall back to largest single deposit
    if (credits.length === 0) return 0;
    return Math.round(Math.abs(credits[0].amount));
  }

  // Return the largest recurring deposit as monthly income
  return Math.round(Math.max(...recurring));
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Get access token from Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("plaid_access_token")
      .eq("id", userId)
      .single();

    if (!profile?.plaid_access_token) {
      return NextResponse.json({ error: "No bank connected" }, { status: 400 });
    }

    // Fetch last 90 days of transactions
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const txRes = await plaid.transactionsGet({
      access_token: profile.plaid_access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    });

    const income = detectIncome(txRes.data.transactions);

    // Save detected income to profiles
    if (income > 0) {
      await supabase.from("profiles").upsert({ id: userId, monthly_income: income });
    }

    return NextResponse.json({ income, transaction_count: txRes.data.transactions.length });
  } catch (e: any) {
    console.error("Plaid income error:", e?.response?.data || e);
    return NextResponse.json({ error: "Failed to detect income" }, { status: 500 });
  }
}
