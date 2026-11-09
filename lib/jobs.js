import { supabase } from "./supabase";

// All database queries live here, so API routes and pages share the same code.

export const ALLOWED_TYPES = ["Internship", "Full-time", "Part-time", "Contract"];

// Removes characters that could break the search filter, and limits length.
export function cleanSearch(text) {
  return String(text || "")
    .replace(/[%*,()\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// Search + filters + pagination. Returns { jobs, total }.
export async function searchJobs({ search = "", location = "", type = "", page = 1, pageSize = 6 }) {
  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  // Every word must appear in the title, company, location or description.
  // (Skills are part of the description, so searching "react" finds React jobs.)
  for (const word of cleanSearch(search).split(" ").filter(Boolean)) {
    query = query.or(
      `job_title.ilike.%${word}%,company_name.ilike.%${word}%,location.ilike.%${word}%,description.ilike.%${word}%`
    );
  }

  if (location) {
    query = query.eq("location", location);
  }

  if (ALLOWED_TYPES.includes(type)) {
    query = query.ilike("employment_type", `%${type}%`);
    // "Full-time Internship" is an internship, so keep it out of the Full-time filter.
    if (type === "Full-time") {
      query = query.not("employment_type", "ilike", "%Internship%");
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("imported_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { jobs: data ?? [], total: count ?? 0 };
}

// One active job by its database id. Returns null if not found.
export async function getJobById(id) {
  if (!/^\d+$/.test(String(id))) return null; // ids are numbers

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Distinct locations of active jobs, for the dropdown.
export async function getLocations() {
  const { data, error } = await supabase
    .from("jobs")
    .select("location")
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => row.location).filter(Boolean))].sort();
}
