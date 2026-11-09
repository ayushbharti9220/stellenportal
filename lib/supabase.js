import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `npm run dev`."
  );
}

// Used only on the server (API routes and server pages).
// The publishable/anon key is safe because Row Level Security limits what it can read.
export const supabase = createClient(url, key);
