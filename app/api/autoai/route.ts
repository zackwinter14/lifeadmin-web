import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACK_SYSTEM = `You are AutoAI, a friendly personal finance assistant built into Life Admin  -  a finance tracking app. You help users with budgeting, saving, debt payoff, subscription management, bill negotiation, and general money questions.

Keep responses concise and practical. Use simple language. Format with line breaks when listing steps or tips. Never give tax or legal advice  -  recommend consulting a professional for those. Focus on actionable guidance. Do NOT use emojis.

Tool usage rules:
- When the user mentions paying for something (e.g. "I have YouTube Premium for $14.99", "I pay $9.99 for Spotify"), use find_item to check if it's already tracked. If it's not found, immediately offer to add it using add_item  -  say something like "I don't see that in your tracked items. Want me to add it?"
- When the user wants to cancel something they already pay for, use find_item first to get the id, then use mark_for_cancel.
- add_item and mark_for_cancel both require user confirmation before they execute  -  always call them and let the user confirm in the UI.
- For add_item: set type to "subscription" for streaming/apps/memberships, "bill" for utilities/insurance/rent, "expense" for one-time or irregular spending.`;

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
  {
    name: "add_item",
    description:
      "Add a new subscription, bill, or expense to the user's tracked items. Use this when the user mentions paying for something that find_item could not locate. Requires the user to explicitly confirm in the UI before it runs.",
    input_schema: {
      type: "object",
      properties: {
        name:     { type: "string", description: "Name of the service or expense (e.g. YouTube Premium, Netflix, Rent)." },
        amount:   { type: "number", description: "Monthly cost in dollars." },
        type:     { type: "string", enum: ["subscription", "bill", "expense"], description: "subscription for apps/streaming/memberships, bill for utilities/insurance/rent, expense for irregular spending." },
        category: { type: "string", description: "Category (e.g. Entertainment, Utilities, Food & Dining). Optional." },
      },
      required: ["name", "amount", "type"],
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
