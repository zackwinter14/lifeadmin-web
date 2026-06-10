import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lightweight  -  no AI calls. Just fetches fresh user data and returns a system prompt.
// Called before every AutoAI message so the AI always has up-to-date numbers.
export async function POST(req: NextRequest) {
  try {
    const { userId, clientIncome } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const [profileRes, itemsRes, ccRes] = await Promise.all([
      supabase.from("profiles").select("full_name, monthly_income, emergency_savings").eq("id", userId).single(),
      supabase.from("items").select("name, amount, type, category, due_date, status").eq("user_id", userId),
      supabase.from("credit_cards").select("name, current_balance, min_payment, due_date").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const allItems = itemsRes.data || [];
    const cards = ccRes.data || [];

    // Include all items (active + others), flag status so AI knows
    const items = allItems.filter((i: any) => i.status !== "cancelled");

    const income = Number(clientIncome) || Number(profile?.monthly_income) || 0;
    const firstName = profile?.full_name?.split(" ")[0] || null;
    const emergencySavings = profile?.emergency_savings || 0;

    const subs = items.filter((i: any) => i.type === "subscription");
    const bills = items.filter((i: any) => i.type === "bill");
    const expenses = items.filter((i: any) => i.type === "expense");
    const trials = items.filter((i: any) => i.type === "trial");

    const fixedTotal = items.reduce((a: number, i: any) => a + (i.amount || 0), 0);
    const ccMinTotal = cards.reduce((a: number, c: any) => a + (c.min_payment || 0), 0);
    const monthlyTotal = fixedTotal + ccMinTotal;
    const spendPct = income > 0 ? Math.round((monthlyTotal / income) * 100) : null;

    const fmtItem = (i: any) => {
      let line = `  - ${i.name}: $${Number(i.amount).toFixed(2)}`;
      if (i.due_date) line += ` (due ${i.due_date})`;
      if (i.category) line += ` [${i.category}]`;
      return line;
    };

    const subsBlock = subs.length > 0
      ? `Subscriptions (${subs.length}, $${subs.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo total):\n${subs.map(fmtItem).join("\n")}`
      : "Subscriptions: none tracked";

    const billsBlock = bills.length > 0
      ? `Bills (${bills.length}, $${bills.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo total):\n${bills.map(fmtItem).join("\n")}`
      : "Bills: none tracked";

    const expensesBlock = expenses.length > 0
      ? `Expenses (${expenses.length}, $${expenses.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo total):\n${expenses.map(fmtItem).join("\n")}`
      : "Expenses: none tracked";

    const trialsBlock = trials.length > 0
      ? `Free trials (${trials.length}  -  may convert to paid):\n${trials.map(fmtItem).join("\n")}`
      : null;

    const cardsBlock = cards.length > 0
      ? `Credit cards:\n${cards.map((c: any) => `  - ${c.name || "Card"}: $${Number(c.current_balance || 0).toFixed(2)} balance, $${Number(c.min_payment || 0).toFixed(2)}/mo min${c.due_date ? ` (due ${c.due_date})` : ""}`).join("\n")}`
      : null;

    const context = [
      firstName ? `User's name: ${firstName}` : null,
      income > 0 ? `Monthly income: $${Number(income).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Monthly income: NOT SET  -  remind the user to set it on the Overview page",
      "",
      subsBlock,
      "",
      billsBlock,
      "",
      expensesBlock,
      trialsBlock ? `\n${trialsBlock}` : null,
      cardsBlock ? `\n${cardsBlock}` : null,
      "",
      `Summary: $${monthlyTotal.toFixed(2)}/mo in total tracked costs${spendPct !== null ? ` (${spendPct}% of income)` : ""}`,
      emergencySavings > 0 ? `Emergency savings: $${Number(emergencySavings).toLocaleString()}` : "Emergency fund: not set",
    ].filter(line => line !== null).join("\n");

    const systemPrompt = `You are AutoAI, a personal finance assistant inside the Life Admin app. Speak in plain English  -  no bullet walls, no fluff, 2-3 sentences max per reply unless the user asks for a list.

USER'S CURRENT FINANCIAL DATA (fetched fresh right now):
${context}

Rules:
- Always reference their actual numbers and names when relevant. Never guess at data you don't have.
- You know each item's exact name, amount, and due date  -  use them.
- When the user mentions paying for something, use find_item to check if it's already tracked. If not, offer to add it with add_item.
- When they want to cancel something, use find_item then mark_for_cancel.
- add_item and mark_for_cancel require user confirmation before executing.
- Do NOT use emojis.`;

    return NextResponse.json({ systemPrompt, income, itemCount: items.length });
  } catch (e) {
    console.error("AutoAI context error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
