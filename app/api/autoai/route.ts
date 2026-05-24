import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK_SYSTEM = `You are AutoAI, a friendly personal finance assistant built into Life Admin — a finance tracking app. You help users with budgeting, saving, debt payoff, subscription management, bill negotiation, and general money questions.

Keep responses concise and practical. Use simple language. Format with line breaks when listing steps or tips. Never give tax or legal advice — recommend consulting a professional for those. Focus on actionable guidance.

When the user wants to cancel something they already pay for, use the mark_for_cancel tool. When they reference an item by name, use find_item first so you have its id. Do NOT use emojis.`;

// Tools AutoAI can request on the website.
// find_item is read-only (no confirm); mark_for_cancel writes and requires user confirmation in the UI.
const AUTO_TOOLS: Anthropic.Tool[] = [
  {
    name: "find_item",
    description:
      "Search the user's tracked items (subscriptions, bills, expenses) by a substring of the name. Read-only and safe to call without user confirmation.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Substring to match against item names." },
      },
      required: ["query"],
    },
  },
  {
    name: "mark_for_cancel",
    description:
      "Flag a tracked subscription or bill for cancellation in Cancel Manager. Requires the user to explicitly confirm in the UI before it runs.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "The item id returned by find_item." },
      },
      required: ["item_id"],
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "No messages" }, { status: 400 });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt || FALLBACK_SYSTEM,
      tools: AUTO_TOOLS,
      messages: messages.map((m: any) => ({
        role: m.role,
        // If the caller already passed full content blocks (e.g. tool_result), keep them.
        content: Array.isArray(m.content) ? m.content : String(m.content || ""),
      })),
    });

    // Walk the full content array so we surface both text and tool_use blocks.
    let text = "";
    const toolUses: { id: string; name: string; input: Record<string, unknown> }[] = [];
    for (const block of response.content) {
      if (block.type === "text") text += (text ? "\n" : "") + block.text;
      else if (block.type === "tool_use") {
        toolUses.push({ id: block.id, name: block.name, input: (block.input || {}) as Record<string, unknown> });
      }
    }

    return NextResponse.json({
      reply: text,
      toolUses,
      rawBlocks: response.content, // client uses this verbatim for follow-up turns
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
