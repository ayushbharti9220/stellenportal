import { NextResponse } from "next/server";
import { getLocations } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// GET /api/jobs/filters -> { locations: ["Delhi, NCR", "Remote", ...] }
export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json({ locations });
  } catch (err) {
    console.error("GET /api/jobs/filters failed:", err.message);
    return NextResponse.json(
      {
        error: "Could not load filters",
        ...(process.env.NODE_ENV !== "production" && { details: err.message }),
      },
      { status: 500 }
    );
  }
}
