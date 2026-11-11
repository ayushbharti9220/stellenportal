import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `npm run dev`."
  );
}

// One shared client for the browser. It remembers the logged-in user.
// Row Level Security in the database decides what each user may read or change.
export const supabaseBrowser =
  globalThis.__stellenportalSupabase ??
  (globalThis.__stellenportalSupabase = createClient(url, key));
