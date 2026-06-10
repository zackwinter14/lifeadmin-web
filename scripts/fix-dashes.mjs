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

function stripDashes(str) {
  if (!str) return str;
  return str
    .replace(/\u2014/g, " - ")   // em dash
    .replace(/\u2013/g, " - ")   // en dash
    .replace(/&mdash;/g, " - ")  // HTML em dash entity
    .replace(/&ndash;/g, " - "); // HTML en dash entity
}

async function run() {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, description, content");

  if (error) { console.error("Fetch error:", error.message); return; }

  console.log(`Checking ${posts.length} posts for dashes...`);

  for (const post of posts) {
    const newTitle       = stripDashes(post.title);
    const newDescription = stripDashes(post.description);
    const newContent     = stripDashes(post.content);

    const changed =
      newTitle !== post.title ||
      newDescription !== post.description ||
      newContent !== post.content;

    if (!changed) {
      console.log(`SKIP (clean): ${post.slug}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ title: newTitle, description: newDescription, content: newContent })
      .eq("id", post.id);

    if (updateError) console.error(`ERROR ${post.slug}:`, updateError.message);
    else console.log(`FIXED: ${post.slug}`);
  }

  console.log("Done.");
}

run().catch(console.error);
