export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
export const WORKPLACE_TYPES = ["On-site", "Hybrid", "Remote"];
export const EXPERIENCE_LEVELS = [
  "Internship",
  "Entry level",
  "Associate",
  "Mid-Senior level",
  "Director",
  "Executive",
];
export const SALARY_PERIODS = [
  { value: "month", label: "per month" },
  { value: "year", label: "per year" },
];
export const APPLICATION_STATUSES = ["submitted", "reviewing", "shortlisted", "rejected", "hired"];

// "- one\n- two" -> ["one", "two"]
export function toList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

// "React, Node.js" -> ["React", "Node.js"]
export function toSkills(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Builds the text shown on job cards, e.g. "₹10,000–15,000 / month" or "₹4–6 LPA"
export function formatSalary(min, max, period) {
  const a = toNumber(min);
  const b = toNumber(max);
  if (!a && !b) return null;

  const show = (n) =>
    period === "year" ? String(Number((n / 100000).toFixed(2))) : n.toLocaleString("en-IN");
  const unit = period === "year" ? " LPA" : " / month";

  if (a && b && a !== b) return `₹${show(a)}–${show(b)}${unit}`;
  return `₹${show(a || b)}${unit}`;
}

function isValidUrl(text) {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Checks the job form. Returns an object like { job_title: "message" } (empty = valid)
export function validateJob(v, { isNew = true } = {}) {
  const e = {};
  const title = v.job_title.trim();

  if (title.length < 3) e.job_title = "Enter a job title (at least 3 characters).";
  if (!v.company_name.trim()) e.company_name = "Enter the company name.";
  if (!v.location.trim()) e.location = "Enter the job location (or Remote).";
  if (!JOB_TYPES.includes(v.employment_type)) e.employment_type = "Choose a job type.";
  if (v.description.trim().length < 50) {
    e.description = "Write at least 50 characters so candidates understand the role.";
  }

  const min = toNumber(v.salary_min);
  const max = toNumber(v.salary_max);
  if ((v.salary_min !== "" && min === null) || (min !== null && min < 0)) {
    e.salary_min = "Enter a valid amount.";
  }
  if ((v.salary_max !== "" && max === null) || (max !== null && max < 0)) {
    e.salary_max = "Enter a valid amount.";
  }
  if (!e.salary_min && !e.salary_max && min !== null && max !== null && min > max) {
    e.salary_max = "Maximum pay must be higher than minimum pay.";
  }

  if (v.openings !== "") {
    const n = Number(v.openings);
    if (!Number.isInteger(n) || n < 1) e.openings = "Enter a whole number, 1 or more.";
  }

  if (v.application_deadline) {
    const today = new Date().toISOString().slice(0, 10);
    if (isNew && v.application_deadline < today) {
      e.application_deadline = "The deadline cannot be in the past.";
    }
  }

  if (v.apply_method === "external" && !isValidUrl(v.apply_url.trim())) {
    e.apply_url = "Enter a full link starting with https://";
  }

  return e;
}
