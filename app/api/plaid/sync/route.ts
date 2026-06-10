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

const INCOME_CATEGORY_KEYWORDS = [
  "payroll", "direct dep", "direct deposit", "salary", "wages", "wage",
  "adp", "gusto", "paychex", "workday", "bamboohr", "zenefits",
  "intuit payroll", "quickbooks payroll", "square payroll",
  "income", "compensation", "earnings",
  "va benefit", "va payment", "veteran", "veterans affairs", "dept of veterans",
  "department of veterans", "disability benefit", "disability payment",
  "social security", "ssa treas", "treasury 310", "irs treas",
  "unemployment", "government benefit", "govt benefit",
];

const EXCLUDE_KEYWORDS = [
  "transfer", "zelle", "venmo", "cashapp", "cash app", "paypal",
  "refund", "return", "credit", "reimburse", "reimbursement",
  "interest", "dividend", "cashback", "reward", "bonus point",
  "atm", "withdrawal",
];

function isLikelyPayroll(txn: any): boolean {
  const name = (txn.name || txn.merchant_name || "").toLowerCase();
  // personal_finance_category.detailed is a string from Plaid, category can be string or string[]
  const catRaw = txn.personal_finance_category?.detailed || txn.category;
  const cats: string[] = (Array.isArray(catRaw) ? catRaw : catRaw ? [catRaw] : [])
    .map((c: string) => c.toLowerCase());

  if (EXCLUDE_KEYWORDS.some(kw => name.includes(kw))) return false;

  const pfcPrimary = (txn.personal_finance_category?.primary || "").toLowerCase();
  if (pfcPrimary === "income") return true;

  const catStr = cats.join(" ");
  if (catStr.includes("payroll") || catStr.includes("income") || catStr.includes("wages")) return true;

  if (INCOME_CATEGORY_KEYWORDS.some(kw => name.includes(kw))) return true;

  return false;
}

function detectIncome(transactions: any[]): number {
  const credits = transactions.filter(t => t.amount < 0 && Math.abs(t.amount) > 200);
  const payrollTxns = credits.filter(isLikelyPayroll);
  const pool = payrollTxns.length > 0 ? payrollTxns : credits;

  if (pool.length === 0) return 0;

  const groups: Record<number, { amounts: number[]; dates: string[] }> = {};
  pool.forEach(t => {
    const rounded = Math.round(Math.abs(t.amount) / 50) * 50;
    if (!groups[rounded]) groups[rounded] = { amounts: [], dates: [] };
    groups[rounded].amounts.push(Math.abs(t.amount));
    groups[rounded].dates.push(t.date);
  });

  const recurring = Object.values(groups)
    .filter(g => {
      if (g.amounts.length < 2) return false;
      const sorted = [...g.dates].sort();
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        gaps.push(diff);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return avgGap >= 6 && avgGap <= 35;
    })
    .map(g => {
      const avg = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length;
      const sorted = [...g.dates].sort();
      const gap = (new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()) / 86400000 / (sorted.length - 1);
      if (gap <= 9) return avg * (52 / 12);
      if (gap <= 18) return avg * (26 / 12);
      return avg;
    });

  if (recurring.length > 0) return Math.round(Math.max(...recurring));

  const sorted = pool.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return Math.round(Math.abs(sorted[0].amount));
}

function detectItemType(category: string | null, merchantName: string): "subscription" | "bill" {
  const cat = (category || "").toLowerCase();
  const name = (merchantName || "").toLowerCase();
  if (
    cat.includes("util") || cat.includes("rent") || cat.includes("insurance") ||
    cat.includes("loan") || cat.includes("mortgage") || cat.includes("phone") ||
    cat.includes("internet") || cat.includes("cable") || cat.includes("electric") ||
    cat.includes("gas") || cat.includes("water") || cat.includes("service") ||
    name.includes("at&t") || name.includes("verizon") || name.includes("t-mobile") ||
    name.includes("sprint") || name.includes("comcast") || name.includes("spectrum") ||
    name.includes("xfinity") || name.includes("cox") || name.includes("directv") ||
    name.includes("electric") || name.includes("water") || name.includes("insurance") ||
    name.includes("geico") || name.includes("state farm") || name.includes("allstate") ||
    name.includes("progressive") || name.includes("liberty mutual") || name.includes("rent") ||
    name.includes("mortgage") || name.includes("hoa") || name.includes("pgande") ||
    name.includes("pge") || name.includes("sdge") || name.includes("con ed")
  ) {
    return "bill";
  }
  return "subscription";
}

function calcNextDate(lastDate: string | null | undefined, frequency: string | null | undefined): string | null {
  if (!lastDate) return null;
  const d = new Date(lastDate);
  switch ((frequency || "").toUpperCase()) {
    case "WEEKLY":       d.setDate(d.getDate() + 7);       break;
    case "BIWEEKLY":     d.setDate(d.getDate() + 14);      break;
    case "SEMI_MONTHLY": d.setDate(d.getDate() + 15);      break;
    case "MONTHLY":      d.setMonth(d.getMonth() + 1);     break;
    case "ANNUALLY":     d.setFullYear(d.getFullYear() + 1); break;
    default:             d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}

function simplifyMerchantName(raw: string): string {
  return (raw || "")
    .replace(/\s+(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?)$/i, "")
    .replace(/\s*#\d+.*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function plaidErrorCode(e: any): string | null {
  return e?.response?.data?.error_code ?? null;
}

function plaidErrorMessage(e: any): string {
  return e?.response?.data?.error_message ?? e?.message ?? "Unknown error";
}

export async function POST(req: NextRequest) {
  // Top-level guard — always returns JSON so the client never gets an empty body
  let userId: string | undefined;
  try {
    const body = await req.json();
    userId = body?.userId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    return await runSync(userId);
  } catch (e: any) {
    console.error("[sync] unhandled error:", e?.message);
    return NextResponse.json({ error: "Sync failed: " + (e?.message ?? "unknown error") }, { status: 500 });
  }
}

async function runSync(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plaid_access_token")
    .eq("id", userId)
    .single();

  if (!profile?.plaid_access_token) {
    return NextResponse.json({ error: "No bank connected" }, { status: 400 });
  }

  // Step 0: fetch live account balance and store in profiles
  try {
    const balanceRes = await plaid.accountsBalanceGet({
      access_token: profile.plaid_access_token,
    });
    const accounts = balanceRes.data.accounts;
    // Use the first depository/checking/savings account we find, or fall back to accounts[0]
    const primary =
      accounts.find(a => a.type === "depository" && a.subtype === "checking") ||
      accounts.find(a => a.type === "depository") ||
      accounts[0];
    if (primary) {
      const balance = primary.balances.current ?? primary.balances.available ?? null;
      const mask = primary.mask ?? null;
      const accountName = primary.official_name || primary.name || null;
      await supabase
        .from("profiles")
        .update({
          plaid_balance: balance,
          plaid_balance_updated_at: new Date().toISOString(),
          plaid_account_name: accountName,
          plaid_account_mask: mask,
        })
        .eq("id", userId);
    }
  } catch (e: any) {
    // Non-fatal — balance display degrades gracefully
    console.error("accountsBalanceGet skipped:", plaidErrorCode(e) ?? e?.message);
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Step 1: fetch transactions  -  each error code gets a specific response
  let transactions: any[] = [];
  try {
    const txRes = await plaid.transactionsGet({
      access_token: profile.plaid_access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500 },
    });
    transactions = txRes.data.transactions;
  } catch (e: any) {
    const code = plaidErrorCode(e);
    const msg = plaidErrorMessage(e);
    console.error("Plaid transactionsGet error:", code, msg);

    if (code === "ITEM_LOGIN_REQUIRED") {
      return NextResponse.json({ error: "reconnect_required", error_code: code }, { status: 400 });
    }
    if (code === "PRODUCT_NOT_READY") {
      return NextResponse.json({
        error: "Bank data is still loading. Wait a moment then try again.",
        error_code: code,
      }, { status: 202 });
    }
    // Return the actual Plaid error so we can see what's happening
    return NextResponse.json({ error: msg, error_code: code ?? "PLAID_ERROR" }, { status: 500 });
  }

  // Step 2: upsert transactions (sign-flipped: expenses stored as negative)
  let stored = 0;
  try {
    const rows = transactions.map(t => ({
      user_id: userId,
      plaid_transaction_id: t.transaction_id,
      merchant_name: t.merchant_name || t.name,
      clean_merchant_name: t.merchant_name || t.name,
      amount: -t.amount,
      date: t.date,
      category: t.personal_finance_category?.primary || t.category?.[0] || null,
    }));
    if (rows.length > 0) {
      // Try upsert first; if unique constraint is missing fall back to insert-ignore
      const { error } = await supabase
        .from("transactions")
        .upsert(rows, { onConflict: "plaid_transaction_id", ignoreDuplicates: true });
      if (error) {
        // Fallback: insert one by one, skip duplicates
        let saved = 0;
        for (const row of rows) {
          const { error: e2 } = await supabase.from("transactions").insert(row);
          if (!e2) saved++;
        }
        stored = saved;
      } else {
        stored = rows.length;
      }
    }
  } catch (e: any) {
    console.error("transactions upsert exception:", e?.message);
  }

  // Step 3: populate recurring_transactions from Plaid's stream detector
  let recurringCount = 0;
  try {
    const recurringRes = await plaid.transactionsRecurringGet({
      access_token: profile.plaid_access_token,
      options: {},
    });
    const outflowStreams = recurringRes.data.outflow_streams || [];
    await supabase.from("recurring_transactions").delete().eq("user_id", userId);
    const recurringRows = outflowStreams
      .filter((s: any) => s.is_active && s.status !== "TOMBSTONED" && (s.average_amount?.amount ?? 0) > 0)
      .map((s: any) => ({
        user_id: userId,
        merchant_name: s.merchant_name || s.description,
        clean_merchant_name: s.merchant_name || s.description,
        average_amount: Math.abs(s.average_amount?.amount ?? 0),
        last_amount: Math.abs(s.last_amount?.amount ?? 0),
        frequency: s.frequency,
        category: s.category?.[0] ?? null,
        is_active: true,
        next_predicted_date: calcNextDate(s.last_date, s.frequency),
      }));
    if (recurringRows.length > 0) {
      await supabase.from("recurring_transactions").insert(recurringRows);
      recurringCount = recurringRows.length;
    }
  } catch (e: any) {
    // Not fatal  -  recurring detection may not be available for all accounts/environments
    console.error("transactionsRecurringGet skipped:", plaidErrorCode(e) ?? e?.message);
  }

  // Step 4: Auto-create items from recurring streams (only insert new ones, never overwrite user changes)
  let itemsCreated = 0;
  try {
    const { data: existingItems } = await supabase
      .from("items")
      .select("id, name, type, source")
      .eq("user_id", userId);
    const existingNames = new Set((existingItems || []).map((i: any) => i.name.toLowerCase().trim()));

    const { data: recurringData } = await supabase
      .from("recurring_transactions")
      .select("merchant_name, clean_merchant_name, average_amount, last_amount, frequency, category")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (recurringData && recurringData.length > 0) {
      // Build lookup of simplified names for incoming streams
      const incomingNames = recurringData
        .map((r: any) => simplifyMerchantName(r.clean_merchant_name || r.merchant_name || "").toLowerCase())
        .filter(n => n.length > 0);

      // Fetch merchant_rules for any of these merchants (community-wide corrections)
      const { data: rulesData } = await supabase
        .from("merchant_rules")
        .select("merchant_name, correct_type, correct_category")
        .in("merchant_name", incomingNames);

      const rulesMap: Record<string, { type: string; category: string }> = {};
      for (const rule of (rulesData || [])) {
        rulesMap[rule.merchant_name.toLowerCase().trim()] = {
          type: rule.correct_type,
          category: rule.correct_category,
        };
      }

      const toInsert = recurringData
        .filter((r: any) => {
          const name = simplifyMerchantName(r.clean_merchant_name || r.merchant_name || "");
          return name.length > 0 && !existingNames.has(name.toLowerCase());
        })
        .map((r: any) => {
          const name = simplifyMerchantName(r.clean_merchant_name || r.merchant_name || "");
          const amount = Math.abs(r.last_amount || r.average_amount || 0);
          // merchant_rules take priority over keyword detection
          const rule = rulesMap[name.toLowerCase()];
          const type = (rule?.type as "subscription" | "bill" | "expense") || detectItemType(r.category, name);
          const category = rule?.category || r.category || (type === "bill" ? "Utilities" : "Entertainment");
          const color = type === "bill" ? "#FFB300" : type === "expense" ? "#FF6B35" : "#3EA758";
          return {
            user_id: userId,
            name,
            amount: parseFloat(amount.toFixed(2)),
            type,
            category,
            source: "detected",
            color,
            autopay: false,
            status: "active",
          };
        });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from("items").insert(toInsert);
        if (!insertError) itemsCreated = toInsert.length;
        else console.error("items insert error:", insertError.message);
      }

      // Apply community rules to auto-detected items only.
      // Never touch items the user manually classified (source = "manual" or "user_override").
      const itemsToFix = (existingItems || []).filter((i: any) => {
        if (i.source === "manual" || i.source === "user_override") return false;
        const rule = rulesMap[i.name.toLowerCase().trim()];
        return rule && rule.type !== i.type;
      });
      for (const item of itemsToFix) {
        const rule = rulesMap[item.name.toLowerCase().trim()];
        const color = rule.type === "bill" ? "#FFB300" : rule.type === "expense" ? "#FF6B35" : "#3EA758";
        await supabase
          .from("items")
          .update({ type: rule.type, category: rule.category, color })
          .eq("id", item.id)
          .eq("user_id", userId);
      }
    }
  } catch (e: any) {
    console.error("auto-insert items failed:", e?.message);
  }

  // Step 5: income detection (runs on raw Plaid amounts before sign flip)
  const income = detectIncome(transactions);
  if (income > 0) {
    await supabase.from("profiles").upsert({ id: userId, monthly_income: income });
  }

  return NextResponse.json({
    synced: transactions.length,
    stored,
    recurring: recurringCount,
    items_created: itemsCreated,
    income,
    synced_at: new Date().toISOString(),
  });
}
