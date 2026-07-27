import { createClient } from "@supabase/supabase-js";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
  supabaseUrl = `https://${supabaseUrl}`;
}
try {
  new URL(supabaseUrl);
} catch {
  supabaseUrl = "https://placeholder.supabase.co";
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
