import { NextRequest, NextResponse } from "next/server";
import { PlaidApi, PlaidEnvironments, Configuration, Products, CountryCode } from "plaid";

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || "production"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
}));

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Life Admin",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    return NextResponse.json({ link_token: response.data.link_token });
  } catch (e: any) {
    console.error("Plaid create-link-token error:", e?.response?.data || e);
    return NextResponse.json({ error: "Failed to create link token" }, { status: 500 });
  }
}
