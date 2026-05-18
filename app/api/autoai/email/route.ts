import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "AutoAI <autoai@lifeadminofficial.com>";

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Load user data
    const [profileRes, itemsRes, ccRes] = await Promise.all([
      supabase.from("profiles").select("full_name, monthly_income, emergency_savings, autoai_email_digest").eq("id", userId).single(),
      supabase.from("items").select("name, amount, type").eq("user_id", userId).neq("type", "expense"),
      supabase.from("credit_cards").select("current_balance").eq("user_id", userId),
    ]);

    const profile = profileRes.data;
    if (!profile || profile.autoai_email_digest === "off") {
      return NextResponse.json({ skipped: true, reason: "digest disabled" });
    }

    // Get user's email from auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const toEmail = authUser?.email;
    if (!toEmail) return NextResponse.json({ error: "No email found" }, { status: 400 });

    const items = itemsRes.data || [];
    const cards = ccRes.data || [];
    const income = profile.monthly_income || 0;
    const firstName = profile.full_name?.split(" ")[0] || "there";
    const fixedTotal = items.reduce((a: number, i: any) => a + i.amount, 0);
    const ccDebt = cards.reduce((a: number, c: any) => a + (c.current_balance || 0), 0);
    const spendPct = income > 0 ? Math.round((fixedTotal / income) * 100) : null;
    const subs = items.filter((i: any) => i.type === "subscription");
    const trials = items.filter((i: any) => i.type === "trial");

    const context = [
      `First name: ${firstName}`,
      income > 0 ? `Monthly income: $${income.toLocaleString()}` : "Income not set",
      `Subscriptions: ${subs.length} totaling $${subs.reduce((a: number, i: any) => a + i.amount, 0).toFixed(0)}/mo`,
      trials.length > 0 ? `Active trials: ${trials.length} (may convert to paid soon)` : null,
      spendPct !== null ? `Fixed costs: ${spendPct}% of income` : null,
      ccDebt > 0 ? `Credit card debt: $${ccDebt.toLocaleString()}` : null,
    ].filter(Boolean).join("\n");

    // Generate email content with Claude
    const response = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: `You are AutoAI, a personal finance assistant for Life Admin. Write a short, warm, personalized financial digest email.
Format:
- Subject line (one line, starts with "Subject: ")
- Blank line
- Short greeting (1 sentence)
- 2-3 key financial insights or action items based on their data (use plain text, no markdown)
- One motivational closing sentence
- Sign off as "AutoAI, your Life Admin assistant"
Keep it concise — under 200 words total. Be specific to their actual numbers.`,
      messages: [{ role: "user", content: `User financial data:\n${context}\n\nWrite the digest email.` }],
    });

    const rawEmail = response.content[0].type === "text" ? response.content[0].text : "";
    const lines = rawEmail.split("\n");
    const subjectLine = lines.find((l: string) => l.startsWith("Subject:")) || "";
    const subject = subjectLine.replace("Subject:", "").trim() || "Your AutoAI financial check-in";
    const bodyText = lines.filter((l: string) => !l.startsWith("Subject:")).join("\n").trim();
    const bodyHtml = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px">
      <div style="margin-bottom:20px">
        <span style="background:#6d28d9;color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">AutoAI</span>
      </div>
      ${bodyText.split("\n").map((p: string) => p.trim() ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#d1d5db">${p}</p>` : "").join("")}
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">
        <a href="https://lifeadminofficial.com/autoai" style="display:inline-block;background:#6d28d9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
          Open AutoAI
        </a>
      </div>
    </div>`;

    // Send via Resend
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: toEmail,
        subject,
        html: bodyHtml,
        text: bodyText,
      }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.json();
      console.error("Resend error:", err);
      return NextResponse.json({ error: "Email send failed", detail: err }, { status: 500 });
    }

    return NextResponse.json({ sent: true, to: toEmail, subject });
  } catch (e) {
    console.error("Email digest error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
