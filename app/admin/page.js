"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";
import { ErrorBox, Loading } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { formatDate } from "@/lib/format";
import { cardClass, dangerBtn, inputClass, primaryBtn, secondaryBtn } from "@/lib/ui";

async function countRows(table, filter) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count } = await query;
  return count ?? 0;
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [totalJobs, activeJobs, employers, seekers, applications, jobsResult] = await Promise.all([
        countRows("jobs"),
        countRows("jobs", (q) => q.eq("is_active", true)),
        countRows("profiles", (q) => q.eq("role", "employer")),
        countRows("profiles", (q) => q.eq("role", "seeker")),
        countRows("applications"),
        supabase
          .from("jobs")
          .select("id,job_title,company_name,location,employment_type,source_name,is_active,imported_at")
          .order("imported_at", { ascending: false })
          .limit(300),
      ]);
      if (cancelled) return;
      if (jobsResult.error) setError(friendlyDbError(jobsResult.error));
      setStats({ totalJobs, activeJobs, employers, seekers, applications });
      setJobs(jobsResult.data || []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!jobs) return [];
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    return jobs.filter((j) => {
      if (filter === "active" && !j.is_active) return false;
      if (filter === "inactive" && j.is_active) return false;
      const text = `${j.job_title} ${j.company_name} ${j.location || ""} ${j.source_name}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [jobs, search, filter]);

  async function toggleActive(job) {
    setBusyId(job.id);
    setError("");
    const { error: updateError } = await supabase.from("jobs").update({ is_active: !job.is_active }).eq("id", job.id);
    if (updateError) setError(friendlyDbError(updateError));
    else setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, is_active: !j.is_active } : j)));
    setBusyId(null);
  }

  async function removeJob(job) {
    if (!window.confirm(`Delete "${job.job_title}"? This cannot be undone.`)) return;
    setBusyId(job.id);
    setError("");
    const { error: deleteError } = await supabase.from("jobs").delete().eq("id", job.id);
    if (deleteError) setError(friendlyDbError(deleteError));
    else setJobs((list) => list.filter((j) => j.id !== job.id));
    setBusyId(null);
  }

  if (!stats || !jobs) return <Loading />;

  const cards = [
    ["Total jobs", stats.totalJobs],
    ["Active jobs", stats.activeJobs],
    ["Employers", stats.employers],
    ["Job seekers", stats.seekers],
    ["Applications", stats.applications],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin dashboard</h1>
          <p className="mt-1 text-slate-600">Manage every job on Stellenportal.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/import" className={secondaryBtn}>Import CSV</Link>
          <Link href="/employer/jobs/new" className={primaryBtn}>Add a job</Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className={`${cardClass} p-4`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, company, location or source"
          aria-label="Search jobs"
          className={`${inputClass} sm:max-w-sm`}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status" className={`${inputClass} sm:w-44`}>
          <option value="all">All jobs</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>

      <div className={`${cardClass} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{job.job_title}</p>
                  <p className="text-slate-500">{[job.company_name, job.location].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{job.source_name}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(job.imported_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={job.is_active ? "active" : "inactive"} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/employer/jobs/${job.id}/edit`} className={secondaryBtn}>Edit</Link>
                    <button type="button" disabled={busyId === job.id} onClick={() => toggleActive(job)} className={secondaryBtn}>
                      {job.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button type="button" disabled={busyId === job.id} onClick={() => removeJob(job)} className={dangerBtn}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No jobs match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Showing {visible.length} of the latest {jobs.length} jobs.</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  );
}
