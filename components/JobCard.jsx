import Link from "next/link";
import { formatDate } from "@/lib/format";

const typeStyles = {
  Internship: "bg-emerald-50 text-emerald-800",
  "Full-time": "bg-blue-50 text-blue-800",
  "Part-time": "bg-amber-50 text-amber-800",
  Contract: "bg-violet-50 text-violet-800",
};

// Picks a colour by looking for a known word in the stored type
function badgeStyle(type) {
  const name = Object.keys(typeStyles).find((t) =>
    (type || "").toLowerCase().includes(t.toLowerCase())
  );
  // Check "Internship" first so "Full-time Internship" shows as an internship
  if ((type || "").toLowerCase().includes("internship")) return typeStyles.Internship;
  return name ? typeStyles[name] : "bg-slate-100 text-slate-700";
}

export default function JobCard({ job }) {
  const date = formatDate(job.posted_at || job.imported_at);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base font-semibold text-slate-700">
          {job.company_name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
            {job.job_title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-slate-600">{job.company_name}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.employment_type && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyle(job.employment_type)}`}>
            {job.employment_type}
          </span>
        )}
        {job.location && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {job.location}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-900">
        {job.salary || "Pay not stated"}
      </p>

      <div className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-500">
        <span>via {job.source_name}</span>
        <span>{date}</span>
      </div>
    </Link>
  );
}
