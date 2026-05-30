import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const [profileRes, itemsRes, ccRes] = await Promise.all([
      supabase.from("profiles").select("full_name, monthly_income, emergency_savings").eq("id", userId).single(),
      supabase.from("items").select("name, amount, type, category, due_date, status").eq("user_id", userId),
      supabase.from("credit_cards").select("name, current_balance, min_payment, due_date").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    const allItems = itemsRes.data || [];
    const cards = ccRes.data || [];

    const items = allItems.filter((i: any) => i.status !== "cancelled");

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
    const ccDebt = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);

    const fmtItem = (i: any) => {
      let line = `  - ${i.name}: $${Number(i.amount).toFixed(2)}`;
      if (i.due_date) line += ` (due ${i.due_date})`;
      return line;
    };

    const subsBlock = subs.length > 0
      ? `Subscriptions (${subs.length}, $${subs.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo):\n${subs.map(fmtItem).join("\n")}`
      : "Subscriptions: none";

    const billsBlock = bills.length > 0
      ? `Bills (${bills.length}, $${bills.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo):\n${bills.map(fmtItem).join("\n")}`
      : "Bills: none";

    const expensesBlock = expenses.length > 0
      ? `Expenses (${expenses.length}, $${expenses.reduce((a: number, i: any) => a + i.amount, 0).toFixed(2)}/mo):\n${expenses.map(fmtItem).join("\n")}`
      : null;

    const trialsBlock = trials.length > 0
      ? `Free trials (converting to paid soon):\n${trials.map(fmtItem).join("\n")}`
      : null;

    const cardsBlock = cards.length > 0
      ? `Credit cards:\n${cards.map((c: any) => `  - ${c.name || "Card"}: $${Number(c.current_balance || 0).toFixed(2)} balance, $${Number(c.min_payment || 0).toFixed(2)}/mo min`).join("\n")}`
      : null;

    const context = [
      firstName ? `User's name: ${firstName}` : null,
      income > 0 ? `Monthly income: $${Number(income).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Monthly income: NOT SET",
      "",
      subsBlock,
      "",
      billsBlock,
      expensesBlock ? `\n${expensesBlock}` : null,
      trialsBlock ? `\n${trialsBlock}` : null,
      cardsBlock ? `\n${cardsBlock}` : null,
      "",
      `Total monthly costs: $${monthlyTotal.toFixed(2)}${spendPct !== null ? ` (${spendPct}% of income)` : ""}`,
      ccDebt > 0 ? `Total credit card debt: $${ccDebt.toLocaleString()}` : null,
      emergencySavings > 0 ? `Emergency savings: $${Number(emergencySavings).toLocaleString()}` : "Emergency fund: not set",
    ].filter(line => line !== null).join("\n");

    // This system prompt is also returned so AutoAI chat can use it for the session
    const systemPrompt = `You are AutoAI, a personal finance assistant inside the Life Admin app. Speak in plain English — no bullet walls, no fluff, 2-3 sentences max per reply unless the user asks for a list.

USER'S CURRENT FINANCIAL DATA:
${context}

Rules:
- Always reference their actual numbers and names when relevant. Never guess at data you don't have.
- You know each item's exact name, amount, and due date — use them.
- When the user mentions paying for something, use find_item to check if it's already tracked. If not, offer to add it with add_item.
- When they want to cancel something, use find_item then mark_for_cancel.
- add_item and mark_for_cancel require user confirmation before executing.
- Do NOT use emojis.`;

    const response = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You are AutoAI, a proactive personal finance assistant inside the Life Admin app.
Generate ONE short, personalized, conversational opening message (2-3 sentences max) based on the user's real financial data.
Be warm but direct. Highlight the most important thing they should act on RIGHT NOW.
If their spending is high relative to income, flag it. If they have trials expiring, warn them. If their emergency fund is low, mention it. If things look good, tell them what to focus on next.
Always end with a specific question that opens a natural conversation.
Do NOT use generic advice. Reference their actual numbers and specific item names. Do NOT use emojis.`,
      messages: [{ role: "user", content: `My financial data:\n${context}\n\nGive me my proactive insight.` }],
    });

    const message = response.content[0].type === "text" ? response.content[0].text : "";

    try {
      await supabase.from("ai_notifications").upsert({
        user_id: userId,
        message,
        created_at: new Date().toISOString(),
        read: false,
      }, { onConflict: "user_id" });
    } catch {}

    return NextResponse.json({ message, systemPrompt });
  } catch (e) {
    console.error("AutoAI insight error:", e);
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
