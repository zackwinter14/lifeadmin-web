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

    // Load user's real financial data
    const [profileRes, itemsRes, ccRes] = await Promise.all([
      supabase.from("profiles").select("full_name, monthly_income, emergency_savings").eq("id", userId).single(),
      supabase.from("items").select("name, amount, type").eq("user_id", userId).neq("type", "expense"),
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
    const trials = items.filter((i: any) => i.type === "trial");
    const fixedTotal = items.reduce((a: number, i: any) => a + (i.amount || 0), 0);
    const ccDebt = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);
    const monthlyExpenses = fixedTotal + cards.reduce((a: number, c: any) => a + (c.min_payment || 0), 0);
    const spendPct = income > 0 ? Math.round((monthlyExpenses / income) * 100) : null;
    const efMonths = fixedTotal > 0 ? Math.round((emergencySavings / fixedTotal) * 10) / 10 : null;

    const context = [
      firstName ? `User's first name: ${firstName}` : null,
      income > 0 ? `Monthly income: $${income.toLocaleString()}` : "Income not set",
      `Subscriptions: ${subs.length} totaling $${subs.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo`,
      `Bills: ${bills.length} totaling $${bills.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo`,
      trials.length > 0 ? `Free trials active: ${trials.length} — these may convert to paid soon` : null,
      spendPct !== null ? `Fixed costs are ${spendPct}% of income (healthy = under 50%)` : null,
      ccDebt > 0 ? `Credit card debt: $${ccDebt.toLocaleString()}` : "No credit card debt tracked",
      efMonths !== null && efMonths > 0 ? `Emergency fund: ${efMonths} months of expenses covered` : "Emergency fund not set",
    ].filter(Boolean).join("\n");

    // Build system prompt that will be reused for all subsequent chat messages
    const systemPrompt = `You are AutoAI, a personal finance assistant inside the Life Admin app. You speak in plain English — no bullet walls, no fluff, 2-3 sentences max per reply.

USER FINANCIAL SNAPSHOT:
${context}

Be specific. Reference their actual numbers when relevant. If something isn't in the snapshot, say so rather than guessing. Do NOT use emojis.`;

    const response = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You are AutoAI, a proactive personal finance assistant inside the Life Admin app.
Generate ONE short, personalized, conversational opening message (2-3 sentences max) based on the user's real financial data.
Be warm but direct. Highlight the most important thing they should act on RIGHT NOW.
If their spending is high, flag it. If they have trials expiring, warn them. If their emergency fund is low, mention it. If things look good, tell them what to focus on next.
Always end with a specific question that opens a natural conversation.
Do NOT use generic advice. Reference their actual numbers. Do NOT use emojis.`,
      messages: [{ role: "user", content: `My financial data:\n${context}\n\nGive me my proactive insight.` }],
    });

    const message = response.content[0].type === "text" ? response.content[0].text : "";

    // Persist notification to Supabase so the bell badge works across sessions
    try {
      await supabase.from("ai_notifications").upsert({
        user_id: userId,
        message,
        created_at: new Date().toISOString(),
        read: false,
      }, { onConflict: "user_id" });
    } catch {} // table may not exist yet

    return NextResponse.json({ message, systemPrompt });
  } catch (e) {
    console.error("AutoAI insight error:", e);
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
