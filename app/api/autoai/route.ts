import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK_SYSTEM = `You are AutoAI, a friendly personal finance assistant built into Life Admin — a finance tracking app. You help users with budgeting, saving, debt payoff, subscription management, bill negotiation, and general money questions.

Keep responses concise and practical. Use simple language. Format with line breaks when listing steps or tips. Never give tax or legal advice — recommend consulting a professional for those. Focus on actionable guidance. Do NOT use emojis.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt || FALLBACK_SYSTEM,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
