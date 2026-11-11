// Turns CSV rows into rows for the `jobs` table, and checks each one.

const WORKPLACES = { remote: "Remote", hybrid: "Hybrid", "on-site": "On-site", onsite: "On-site", "on site": "On-site" };

function normalizeType(text) {
  const s = (text || "").toLowerCase();
  if (s.includes("intern")) return "Internship";
  if (s.includes("part")) return "Part-time";
  if (s.includes("contract") || s.includes("freelance")) return "Contract";
  return "Full-time";
}

// Small fingerprint, used as an ID when the CSV has no source_job_id (stops duplicates)
function fingerprint(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return "auto-" + (hash >>> 0).toString(36);
}

// "one | two | three" (or separate lines) -> one item per line, like the job form
function toLines(text) {
  return (text || "")
    .split(/\r?\n|\|/)
    .map((part) => part.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
}

function isDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(text + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

function isUrl(text) {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Returns { valid: [...], invalid: [{ line, reason }] }
export function prepareJobRows(records) {
  const valid = [];
  const invalid = [];

  records.forEach((r, index) => {
    const line = index + 2; // line 1 is the header
    const title = (r.job_title || "").trim();
    const company = (r.company_name || "").trim();
    const applyUrl = (r.apply_url || "").trim();
    const sourceUrl = (r.source_url || "").trim();

    if (!title) return invalid.push({ line, reason: "job_title is empty" });
    if (!company) return invalid.push({ line, reason: "company_name is empty" });
    if (!applyUrl && !sourceUrl) return invalid.push({ line, reason: "needs apply_url or source_url" });
    if (applyUrl && !isUrl(applyUrl)) return invalid.push({ line, reason: "apply_url is not a valid link" });
    if (sourceUrl && !isUrl(sourceUrl)) return invalid.push({ line, reason: "source_url is not a valid link" });

    const deadline = (r.application_deadline || "").trim();
    if (deadline && !isDate(deadline)) {
      return invalid.push({ line, reason: "application_deadline must look like 2026-12-31" });
    }
    const openingsText = (r.openings || "").trim();
    if (openingsText && !/^[1-9]\d{0,5}$/.test(openingsText)) {
      return invalid.push({ line, reason: "openings must be a whole number, 1 or more" });
    }

    const sourceName = (r.source_name || "").trim() || "CSV import";
    const location = (r.location || "").trim();
    let postedAt = null;
    if (r.posted_at) {
      const d = new Date(r.posted_at);
      if (!Number.isNaN(d.getTime())) postedAt = d.toISOString();
    }

    valid.push({
      job_title: title,
      company_name: company,
      location: location || null,
      employment_type: normalizeType(r.employment_type),
      workplace_type: WORKPLACES[(r.workplace_type || "").toLowerCase()] || null,
      salary: (r.salary || "").trim() || null,
      experience: (r.experience || "").trim() || null,
      education: (r.education || "").trim() || null,
      openings: openingsText ? Number(openingsText) : null,
      application_deadline: deadline || null,
      description: (r.description || "").trim() || null,
      responsibilities: toLines(r.responsibilities) || null,
      requirements: toLines(r.requirements) || null,
      skills: (r.skills || "").trim() || null,
      benefits: toLines(r.benefits) || null,
      source_name: sourceName,
      source_job_id:
        (r.source_job_id || "").trim() ||
        fingerprint(`${title}|${company}|${location}`.toLowerCase()),
      source_url: sourceUrl || applyUrl,
      apply_url: applyUrl || sourceUrl,
      posted_at: postedAt,
      apply_method: "external",
      is_active: true,
    });
  });

  return { valid, invalid };
}
