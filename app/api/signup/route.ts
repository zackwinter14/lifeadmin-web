import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { uid, full_name, phone, hear_about, looking_for, referral_code } = await req.json();

    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let account_code = "LA-" + new Date().getFullYear() + "-";
    for (let i = 0; i < 5; i++) account_code += chars[Math.floor(Math.random() * chars.length)];

    const patch: Record<string, string> = { id: uid, account_code };
    if (full_name?.trim()) patch.full_name = full_name.trim();
    if (phone?.trim()) patch.phone = phone.trim();
    if (hear_about) patch.hear_about = hear_about;
    if (looking_for) patch.looking_for = looking_for;
    if (referral_code?.trim()) patch.referral_code = referral_code.trim();

    const { error } = await supabase.from("profiles").upsert(patch, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
