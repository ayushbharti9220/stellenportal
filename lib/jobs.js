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

// Builds the search query. `wide` also searches the Phase 5 columns (skills, requirements).
function buildSearchQuery({ search, location, type, page, pageSize, wide }) {
  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  // Every word must appear in the title, company, location or description.
  for (const word of cleanSearch(search).split(" ").filter(Boolean)) {
    const columns = ["job_title", "company_name", "location", "description"];
    if (wide) columns.push("skills", "requirements");
    query = query.or(columns.map((c) => `${c}.ilike.%${word}%`).join(","));
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

  return query
    .order("imported_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
}

// Search + filters + pagination. Returns { jobs, total }.
export async function searchJobs({ search = "", location = "", type = "", page = 1, pageSize = 6 }) {
  const options = { search, location, type, page, pageSize };

  let { data, count, error } = await buildSearchQuery({ ...options, wide: true });

  // If the Phase 5 database update has not been run yet, the new columns do not exist.
  // Fall back to the original columns so the homepage keeps working.
  if (error && /column|schema cache/i.test(error.message)) {
    ({ data, count, error } = await buildSearchQuery({ ...options, wide: false }));
  }

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
