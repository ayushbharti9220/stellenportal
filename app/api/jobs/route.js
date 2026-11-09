import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// GET /api/jobs?search=python&location=Remote&type=Internship&page=1&pageSize=6
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const pageSize = Math.min(24, Math.max(1, parseInt(searchParams.get("pageSize")) || 6));

  try {
    const { jobs, total } = await searchJobs({
      search: searchParams.get("search") || "",
      location: (searchParams.get("location") || "").trim(),
      type: searchParams.get("type") || "",
      page,
      pageSize,
    });
    return NextResponse.json({ jobs, total, page, pageSize });
  } catch (err) {
    console.error("GET /api/jobs failed:", err.message);
    return NextResponse.json(
      {
        error: "Could not load jobs",
        // Show the real reason only while developing
        ...(process.env.NODE_ENV !== "production" && { details: err.message }),
      },
      { status: 500 }
    );
  }
}
