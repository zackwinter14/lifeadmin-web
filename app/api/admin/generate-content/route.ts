import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const { type, topic, subreddit, userId } = await req.json();
  if (!topic || !type) return NextResponse.json({ error: "Missing topic or type" }, { status: 400 });

  // Verify caller is admin
  if (userId) {
    const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", userId).single();
    // Allow any logged-in user for now; tighten with email check if needed
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (type === "blog") {
    const response = await ai.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      system: `You are a personal finance content writer for Life Admin, a subscription tracker and personal finance app.
Write high-quality, SEO-optimized blog articles that rank on Google.

Format your response as JSON with these exact keys:
{
  "title": "SEO-optimized H1 title (under 60 chars)",
  "description": "Meta description (under 160 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "Full HTML article content"
}

For the content:
- Write 800-1200 words
- Use proper HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a href="/signup">
- Include a natural mention of Life Admin as a tool that helps with the topic
- Write in a clear, practical voice  -  not salesy
- Target people who are frustrated with wasting money
- Include specific numbers and examples where possible
- End with a clear action step`,
      messages: [{ role: "user", content: `Write a blog article about: ${topic}` }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ...parsed, slug: slugify(parsed.title), type: "blog" });
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    }
  }

  if (type === "reddit") {
    const sub = subreddit || "personalfinance";
    const response = await ai.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1000,
      system: `You write Reddit posts for r/${sub} about personal finance.
Write authentic, helpful Reddit posts that don't feel like ads.
Mention Life Admin naturally if relevant  -  as a tool you use, not a promotion.
Reddit voice: conversational, honest, slightly self-deprecating when appropriate.
Format as JSON: { "title": "post title", "body": "post body in markdown" }
Keep it under 400 words. Be genuinely helpful first.`,
      messages: [{ role: "user", content: `Write a Reddit post for r/${sub} about: ${topic}` }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ ...parsed, subreddit: sub, type: "reddit" });
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
