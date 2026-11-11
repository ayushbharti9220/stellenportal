"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "@/components/AuthProvider";
import RequireRole from "@/components/RequireRole";
import StatusBadge from "@/components/StatusBadge";
import { ErrorBox, Loading } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { downloadCv } from "@/lib/cv";
import { formatDate } from "@/lib/format";
import { cardClass, primaryBtn, secondaryBtn } from "@/lib/ui";

function MyApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: loadError } = await supabase
        .from("applications")
        .select("id,status,created_at,cv_path,cv_filename,job_id,jobs(id,job_title,company_name)")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (loadError) setError(friendlyDbError(loadError));
      setApps(data || []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function handleCv(app) {
    const message = await downloadCv(app.cv_path, app.cv_filename);
    if (message) setError(message);
  }

  if (apps === null) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My applications</h1>
      <p className="mt-1 text-slate-600">Jobs you applied to on Stellenportal.</p>

      <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>

      {apps.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold">No applications yet</h2>
          <p className="mt-1 text-sm text-slate-600">Find a job and use Apply Now. Jobs that apply on other websites are not listed here.</p>
          <Link href="/#jobs" className={`${primaryBtn} mt-5`}>Browse jobs</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {apps.map((app) => (
            <div key={app.id} className={`${cardClass} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="min-w-0">
                <h2 className="font-semibold">{app.jobs?.job_title || "This job is no longer listed"}</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {[app.jobs?.company_name, `Applied ${formatDate(app.created_at)}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={app.status} />
                {app.jobs && <Link href={`/jobs/${app.jobs.id}`} className={secondaryBtn}>View job</Link>}
                {app.cv_path && (
                  <button type="button" onClick={() => handleCv(app)} className={secondaryBtn}>My CV</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <RequireRole roles={["seeker"]}>
      <MyApplications />
    </RequireRole>
  );
}
