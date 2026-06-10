import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n").filter(l => l.includes("=")).map(l => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Realistic bi-weekly publishing cadence over 5 months
const dates = [
  { slug: "how-to-build-an-emergency-fund",             published_at: "2025-01-10T09:00:00Z" },
  { slug: "how-to-find-and-cancel-forgotten-subscriptions", published_at: "2025-01-24T09:00:00Z" },
  { slug: "how-to-start-a-monthly-budget",              published_at: "2025-02-07T09:00:00Z" },
  { slug: "50-30-20-budget-rule-explained",             published_at: "2025-02-21T09:00:00Z" },
  { slug: "debt-snowball-vs-avalanche",                 published_at: "2025-03-07T09:00:00Z" },
  { slug: "how-to-track-net-worth",                    published_at: "2025-03-21T09:00:00Z" },
  { slug: "subscriptions-you-forgot-about",            published_at: "2025-04-04T09:00:00Z" },
  { slug: "how-to-save-for-a-goal",                   published_at: "2025-04-18T09:00:00Z" },
  { slug: "how-to-negotiate-monthly-bills",            published_at: "2025-05-02T09:00:00Z" },
  { slug: "ways-to-lower-monthly-expenses",            published_at: "2025-05-16T09:00:00Z" },
  { slug: "budgeting-for-beginners",                   published_at: "2025-05-30T09:00:00Z" },
  { slug: "how-to-organize-your-financial-life",       published_at: "2025-06-06T09:00:00Z" },
];

async function run() {
  console.log("Staggering publish dates...");
  for (const { slug, published_at } of dates) {
    const { error } = await supabase
      .from("blog_posts")
      .update({ published_at })
      .eq("slug", slug);
    if (error) console.error(`ERROR ${slug}:`, error.message);
    else console.log(`OK ${slug} → ${published_at}`);
  }
  console.log("Done.");
}

run().catch(console.error);
