import { NextRequest, NextResponse } from "next/server";
import { PlaidApi, PlaidEnvironments, Configuration, CountryCode } from "plaid";
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

// Creates a Plaid Link token in update mode so users can re-authenticate
// an existing connection without losing their access token.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("plaid_access_token")
      .eq("id", userId)
      .single();

    if (!profile?.plaid_access_token) {
      return NextResponse.json({ error: "No bank connected" }, { status: 400 });
    }

    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Life Admin",
      access_token: profile.plaid_access_token,
      country_codes: [CountryCode.Us],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (e: any) {
    console.error("Plaid update-link-token error:", e?.response?.data || e);
    return NextResponse.json({ error: "Failed to create update link token" }, { status: 500 });
  }
}
