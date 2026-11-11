"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "@/components/AuthProvider";
import { ErrorBox, Loading, Message } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { CV_BUCKET, checkCvFile, safeFileName } from "@/lib/cv";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function ApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, loading } = useAuth();

  const [job, setJob] = useState(undefined); // undefined = loading, null = not found
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  // null = the user has not typed yet, so we show the value saved in their profile
  const [typedName, setTypedName] = useState(null);
  const [typedPhone, setTypedPhone] = useState(null);
  const fullName = typedName ?? profile?.full_name ?? "";
  const phone = typedPhone ?? profile?.phone ?? "";
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Not logged in -> go to login, and come back here afterwards
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  // Load the job, and check if this user already applied
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("jobs")
        .select("id,job_title,company_name,apply_method,application_deadline,is_active,apply_url")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      setJob(data ?? null);

      if (data) {
        const { data: existing } = await supabase
          .from("applications").select("id").eq("job_id", id).eq("applicant_id", user.id).maybeSingle();
        if (!cancelled && existing) setAlreadyApplied(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (phone.trim() && !/^[0-9+\-\s()]{7,18}$/.test(phone.trim())) return setError("Enter a valid phone number.");
    const fileProblem = checkCvFile(cvFile);
    if (fileProblem) return setError(fileProblem);

    setSubmitting(true);

    // 1. Upload the CV into this user's private folder
    const path = `${user.id}/${Date.now()}-${safeFileName(cvFile.name)}`;
    const { error: uploadError } = await supabase.storage.from(CV_BUCKET).upload(path, cvFile, {
      contentType: cvFile.type || undefined,
      upsert: false,
    });
    if (uploadError) {
      const text = `${uploadError.message}`.toLowerCase();
      setError(
        text.includes("bucket")
          ? "CV storage is not set up yet. Run database/phase5-migration.sql in Supabase."
          : `Could not upload your CV: ${uploadError.message}`
      );
      setSubmitting(false);
      return;
    }

    // 2. Save the application
    const { error: insertError } = await supabase.from("applications").insert({
      job_id: job.id,
      applicant_id: user.id,
      full_name: fullName.trim(),
      email: user.email,
      phone: phone.trim() || null,
      cover_letter: coverLetter.trim() || null,
      cv_path: path,
      cv_filename: cvFile.name,
    });

    if (insertError) {
      await supabase.storage.from(CV_BUCKET).remove([path]); // do not leave an orphan file
      setError(insertError.code === "23505" ? "You have already applied to this job." : friendlyDbError(insertError));
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  if (loading || !user || job === undefined) return <Loading />;

  if (!job || !job.is_active) {
    return <Message title="This job is no longer available" href="/" action="Browse all jobs" />;
  }
  if (job.apply_method !== "internal") {
    return (
      <Message
        title="Apply on the company website"
        text="This job accepts applications on an external website."
        href={`/jobs/${job.id}`}
        action="Back to the job"
      />
    );
  }
  if (role !== "seeker") {
    return (
      <Message
        title="Only job seeker accounts can apply"
        text="You are logged in with an employer or admin account. Log in with a job seeker account to apply."
        href={`/jobs/${job.id}`}
        action="Back to the job"
      />
    );
  }
  if (job.application_deadline && job.application_deadline < new Date().toISOString().slice(0, 10)) {
    return <Message title="Applications are closed" text="The deadline for this job has passed." href={`/jobs/${job.id}`} action="Back to the job" />;
  }
  if (done) {
    return (
      <Message
        title="Application sent"
        text={`Your application for ${job.job_title} at ${job.company_name} was submitted.`}
        href="/applications"
        action="View my applications"
      />
    );
  }
  if (alreadyApplied) {
    return (
      <Message
        title="You already applied"
        text={`You have already applied for ${job.job_title}.`}
        href="/applications"
        action="View my applications"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={`/jobs/${job.id}`} className="text-sm text-slate-600 hover:text-blue-700">Back to the job</Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Apply for {job.job_title}</h1>
      <p className="mt-1 text-slate-600">{job.company_name}</p>

      <form onSubmit={handleSubmit} className={`${cardClass} mt-8 space-y-5 p-5 sm:p-6`} noValidate>
        <ErrorBox>{error}</ErrorBox>

        <div>
          <label htmlFor="fullName" className={labelClass}>Full name <span className="text-red-600">*</span></label>
          <input id="fullName" className={inputClass} value={fullName} onChange={(e) => setTypedName(e.target.value)} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" className={inputClass} value={user.email} disabled readOnly />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input id="phone" type="tel" className={inputClass} value={phone} onChange={(e) => setTypedPhone(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div>
          <label htmlFor="cv" className={labelClass}>Upload your CV <span className="text-red-600">*</span></label>
          <input
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
          />
          <p className="mt-1.5 text-xs text-slate-500">PDF, DOC or DOCX, up to 5 MB. Only the employer can see it.</p>
        </div>

        <div>
          <label htmlFor="cover" className={labelClass}>Cover letter</label>
          <textarea id="cover" rows={5} className={inputClass} value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)} maxLength={3000}
            placeholder="Optional: why are you a good fit for this role?" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className={primaryBtn}>
            {submitting ? "Submitting..." : "Submit application"}
          </button>
          <Link href={`/jobs/${job.id}`} className={secondaryBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
