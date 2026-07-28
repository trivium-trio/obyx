import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient>;
try {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!url || url.includes("[SENSITIVE]") || url.includes("***") || url === "undefined" || url === "null") {
    url = "https://placeholder.supabase.co";
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  new URL(url);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  supabase = createClient(url, key);
} catch {
  supabase = createClient("https://placeholder.supabase.co", "placeholder-anon-key");
}

export { supabase };
