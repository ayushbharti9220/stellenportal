"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import RequireRole from "@/components/RequireRole";
import JobForm from "@/components/JobForm";
import { Loading, Message } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";

function EditJob() {
  const { id } = useParams();
  const [job, setJob] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: loadError } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (loadError) setError(friendlyDbError(loadError));
      setJob(loadError ? null : data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (job === undefined) return <Loading />;
  if (!job) {
    return <Message title="Job not found" text={error || "This job does not exist, or it is not yours."} href="/employer" action="Back to my jobs" />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit job</h1>
      <p className="mt-1 text-slate-600">{job.job_title}</p>
      <div className="mt-8">
        <JobForm mode="edit" job={job} />
      </div>
    </div>
  );
}

export default function EditJobPage() {
  return (
    <RequireRole roles={["employer", "admin"]}>
      <EditJob />
    </RequireRole>
  );
}
