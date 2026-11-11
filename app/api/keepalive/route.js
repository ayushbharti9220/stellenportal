import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/keepalive
// Vercel calls this once a day (see vercel.json). The tiny database read keeps the free
// Supabase project "active", so it is not paused after a week without activity.
export async function GET(request) {
  // Optional protection: if you add a CRON_SECRET variable in Vercel, only Vercel's cron may call this.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    console.error("keepalive failed:", error.message);
    return NextResponse.json({ ok: false, error: "Database not reachable" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, activeJobs: count, checkedAt: new Date().toISOString() });
}
