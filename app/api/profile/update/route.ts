import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Updates profile fields using the service role to bypass any RLS gaps.
// Uses UPDATE (not upsert) to avoid NOT NULL constraint failures on INSERT
// for users whose profile row was created before the full signup flow.
// If no row exists yet, creates a minimal one first.
export async function POST(req: NextRequest) {
  try {
    const { userId, ...fields } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Try UPDATE first — works for all users who have an existing profile row.
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", userId)
      .select("id");

    if (updateError) {
      console.error("Profile update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If no row was matched, insert a minimal row then update it.
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, ...fields });

      if (insertError) {
        // Insert failed (likely missing required columns). Try a bare insert with just id + fields.
        console.error("Profile insert error:", insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
