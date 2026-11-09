import { NextResponse } from "next/server";
import { getJobById } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// GET /api/jobs/101 -> { job: {...} }
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    console.error("GET /api/jobs/[id] failed:", err.message);
    return NextResponse.json(
      {
        error: "Could not load job",
        ...(process.env.NODE_ENV !== "production" && { details: err.message }),
      },
      { status: 500 }
    );
  }
}
