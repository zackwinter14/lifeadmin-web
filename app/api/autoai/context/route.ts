import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lightweight — no AI calls. Just fetches fresh user data and returns a system prompt.
// Called before every AutoAI message so the AI always has up-to-date numbers.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const [profileRes, itemsRes, ccRes] = await Promise.all([
      supabase.from("profiles").select("full_name, monthly_income, emergency_savings").eq("id", userId).single(),
      supabase.from("items").select("name, amount, type, category").eq("user_id", userId).eq("status", "active"),
      supabase.from("credit_cards").select("current_balance, min_payment").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const items = itemsRes.data || [];
    const cards = ccRes.data || [];

    const income = profile?.monthly_income || 0;
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

    const itemList = items.length > 0
      ? items.map((i: any) => `  - ${i.name}: $${i.amount}/mo (${i.type})`).join("\n")
      : "  None tracked yet.";

    const context = [
      firstName ? `User's name: ${firstName}` : null,
      income > 0 ? `Monthly income: $${income.toLocaleString()}/mo` : "Monthly income: not set — remind the user to set it on the Overview page",
      `\nTracked items (${items.length} total):\n${itemList}`,
      `\nSummary: ${subs.length} subscriptions ($${subs.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo), ${bills.length} bills ($${bills.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo), ${expenses.length} expenses ($${expenses.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo)`,
      trials.length > 0 ? `Active free trials: ${trials.map((t: any) => t.name).join(", ")} — may convert to paid soon` : null,
      spendPct !== null ? `Fixed costs are ${spendPct}% of income` : null,
      emergencySavings > 0 ? `Emergency savings: $${emergencySavings.toLocaleString()}` : "Emergency fund: not set",
      cards.length > 0 ? `Credit card debt: $${cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0).toLocaleString()}` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are AutoAI, a personal finance assistant inside the Life Admin app. Speak in plain English — no bullet walls, no fluff, 2-3 sentences max per reply unless the user asks for a list.

USER'S CURRENT FINANCIAL DATA (fetched fresh right now):
${context}

Rules:
- Always reference their actual numbers when relevant. Never guess at data you don't have.
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
