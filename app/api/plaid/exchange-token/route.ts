import { NextRequest, NextResponse } from "next/server";
import { PlaidApi, PlaidEnvironments, Configuration } from "plaid";
import { createClient } from "@supabase/supabase-js";

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || "production"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
}));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { publicToken, userId } = await req.json();

    // Exchange public token for access token
    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    // Save access token — use update first, fall back to upsert
    // Do NOT include plaid_item_id in case that column doesn't exist
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ plaid_access_token: accessToken })
      .eq("id", userId);
    if (updateErr) {
      // Row might not exist yet — try upsert with just the essential field
      await supabase.from("profiles").upsert({ id: userId, plaid_access_token: accessToken });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Plaid exchange-token error:", e?.response?.data || e);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}
