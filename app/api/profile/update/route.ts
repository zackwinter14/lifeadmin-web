import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function genAccountCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LA-" + new Date().getFullYear() + "-";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Updates profile fields using the service role to bypass any RLS gaps.
// Tries UPDATE first (safe for existing rows). If no row exists yet,
// creates a minimal profile row with a generated account_code, then applies the fields.
export async function POST(req: NextRequest) {
  try {
    const { userId, ...fields } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Try UPDATE — works for all users with an existing profile row.
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", userId)
      .select("id");

    if (updateError) {
      console.error("Profile update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // No row existed — create a minimal profile and apply the fields.
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, account_code: genAccountCode(), ...fields });

      if (insertError) {
        console.error("Profile insert error:", insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
