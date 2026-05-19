import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data: items } = await supabase
    .from("items")
    .select("id, name, type, category")
    .eq("user_id", userId)
    .neq("source", "manual");

  if (!items || items.length === 0) return NextResponse.json({ updated: 0 });

  const names = items.map(i => i.name);

  const prompt = `You are a financial data classifier. Classify each merchant/service by type.

Rules:
- "bill": MUST-pay recurring charges (utilities electric/gas/water, rent, mortgage, phone, internet, cable, HOA, insurance, car payment, loan)
- "subscription": optional recurring services you CHOOSE (streaming video/music, apps, gym, news, software, gaming, meal kits, beauty boxes)
- "expense": one-time or irregular (restaurants, retail stores, gas stations, travel, grocery, medical, ATM, transfers)

Merchants to classify:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Return ONLY a JSON array, no explanation:
[{"name": "Netflix", "type": "subscription"}, {"name": "Verizon", "type": "bill"}, ...]`;

  let classified: { name: string; type: string }[] = [];
  try {
    const res = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (res.content[0] as any).text || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) classified = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "AI classification failed" }, { status: 500 });
  }

  // Build a map name → type
  const typeMap: Record<string, string> = {};
  for (const c of classified) {
    if (c.name && c.type) typeMap[c.name.toLowerCase().trim()] = c.type;
  }

  // Update items where AI disagrees with current type
  let updated = 0;
  for (const item of items) {
    const aiType = typeMap[item.name.toLowerCase().trim()];
    if (!aiType || aiType === item.type) continue;
    const validTypes = ["bill", "subscription", "expense"];
    if (!validTypes.includes(aiType)) continue;
    await supabase
      .from("items")
      .update({
        type: aiType,
        color: aiType === "bill" ? "#FFB300" : aiType === "expense" ? "#FF6B35" : "#3EA758",
      })
      .eq("id", item.id)
      .eq("user_id", userId);
    updated++;
  }

  return NextResponse.json({ updated, total: items.length });
}
