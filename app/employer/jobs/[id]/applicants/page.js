"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";
import { ErrorBox, Loading, Message } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { APPLICATION_STATUSES } from "@/lib/jobFormat";
import { downloadCv } from "@/lib/cv";
import { formatDate } from "@/lib/format";
import { cardClass, inputClass, secondaryBtn } from "@/lib/ui";

function Applicants() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined);
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs").select("id,job_title,company_name").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (jobError || !jobData) {
        setError(jobError ? friendlyDbError(jobError) : "");
        setJob(null);
        return;
      }
      const { data: appData, error: appError } = await supabase
        .from("applications").select("*").eq("job_id", id).order("created_at", { ascending: false });
      if (cancelled) return;
      if (appError) setError(friendlyDbError(appError));
      setApps(appData || []);
      setJob(jobData);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changeStatus(app, status) {
    setBusyId(app.id);
    setError("");
    const { error: updateError } = await supabase.from("applications").update({ status }).eq("id", app.id);
    if (updateError) setError(friendlyDbError(updateError));
    else setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status } : a)));
    setBusyId(null);
  }

  async function handleCv(app) {
    setError("");
    const message = await downloadCv(app.cv_path, app.cv_filename);
    if (message) setError(message);
  }

  if (job === undefined) return <Loading />;
  if (!job) {
    return <Message title="Job not found" text={error || "This job does not exist, or it is not yours."} href="/employer" action="Back to my jobs" />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/employer" className="text-sm text-slate-600 hover:text-blue-700">Back to my jobs</Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Applicants</h1>
      <p className="mt-1 text-slate-600">{job.job_title} · {apps.length} {apps.length === 1 ? "application" : "applications"}</p>

      <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>

      {apps.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No applications yet</h2>
          <p className="mt-1 text-sm text-slate-600">New applications will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {apps.map((app) => (
            <article key={app.id} className={`${cardClass} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{app.full_name}</h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    <a href={`mailto:${app.email}`} className="text-blue-700 hover:underline">{app.email}</a>
                    {app.phone ? ` · ${app.phone}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Applied {formatDate(app.created_at)}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {app.cover_letter && (
                <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {app.cover_letter}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {app.cv_path && (
                  <button type="button" onClick={() => handleCv(app)} className={secondaryBtn}>
                    Download CV
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Status
                  <select
                    value={app.status}
                    disabled={busyId === app.id}
                    onChange={(e) => changeStatus(app, e.target.value)}
                    className={`${inputClass} w-auto py-2`}
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <RequireRole roles={["employer", "admin"]}>
      <Applicants />
    </RequireRole>
  );
}
