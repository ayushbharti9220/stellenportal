"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "@/components/AuthProvider";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";
import { ErrorBox, Loading } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { formatDate } from "@/lib/format";
import { cardClass, dangerBtn, primaryBtn, secondaryBtn } from "@/lib/ui";

function MyJobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select("id,job_title,location,employment_type,is_active,imported_at,application_deadline,apply_method")
        .eq("posted_by", user.id)
        .order("imported_at", { ascending: false });

      if (cancelled) return;
      if (jobsError) {
        setError(friendlyDbError(jobsError));
        setJobs([]);
        return;
      }

      const ids = data.map((j) => j.id);
      const map = {};
      if (ids.length > 0) {
        const { data: apps } = await supabase.from("applications").select("job_id").in("job_id", ids);
        (apps || []).forEach((a) => {
          map[a.job_id] = (map[a.job_id] || 0) + 1;
        });
      }
      if (cancelled) return;
      setCounts(map);
      setJobs(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function toggleActive(job) {
    setBusyId(job.id);
    setError("");
    const { error: updateError } = await supabase.from("jobs").update({ is_active: !job.is_active }).eq("id", job.id);
    if (updateError) setError(friendlyDbError(updateError));
    else setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, is_active: !j.is_active } : j)));
    setBusyId(null);
  }

  async function removeJob(job) {
    if (!window.confirm(`Delete "${job.job_title}"? Its applications will be deleted too. This cannot be undone.`)) return;
    setBusyId(job.id);
    setError("");
    const { error: deleteError } = await supabase.from("jobs").delete().eq("id", job.id);
    if (deleteError) setError(friendlyDbError(deleteError));
    else setJobs((list) => list.filter((j) => j.id !== job.id));
    setBusyId(null);
  }

  if (jobs === null) return <Loading />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My jobs</h1>
          <p className="mt-1 text-slate-600">{profile?.company_name || "Your company"}</p>
        </div>
        <Link href="/employer/jobs/new" className={primaryBtn}>Post a new job</Link>
      </div>

      <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">You have not posted any jobs yet</h2>
          <p className="mt-1 text-sm text-slate-600">Post your first job and start receiving applications.</p>
          <Link href="/employer/jobs/new" className={`${primaryBtn} mt-5`}>Post a job</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className={`${cardClass} flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{job.job_title}</h2>
                  <StatusBadge status={job.is_active ? "active" : "inactive"} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {[job.location, job.employment_type, `Posted ${formatDate(job.imported_at)}`].filter(Boolean).join(" · ")}
                </p>
                {job.application_deadline && (
                  <p className="mt-0.5 text-xs text-slate-500">Deadline {formatDate(job.application_deadline)}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {job.apply_method === "internal" && (
                  <Link href={`/employer/jobs/${job.id}/applicants`} className={secondaryBtn}>
                    Applicants ({counts[job.id] || 0})
                  </Link>
                )}
                <Link href={`/jobs/${job.id}`} className={secondaryBtn}>View</Link>
                <Link href={`/employer/jobs/${job.id}/edit`} className={secondaryBtn}>Edit</Link>
                <button type="button" disabled={busyId === job.id} onClick={() => toggleActive(job)} className={secondaryBtn}>
                  {job.is_active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" disabled={busyId === job.id} onClick={() => removeJob(job)} className={dangerBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployerPage() {
  return (
    <RequireRole roles={["employer", "admin"]}>
      <MyJobs />
    </RequireRole>
  );
}
