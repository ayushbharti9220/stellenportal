"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "./AuthProvider";
import { ErrorBox } from "./PageState";
import { friendlyDbError } from "@/lib/authErrors";
import {
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  SALARY_PERIODS,
  WORKPLACE_TYPES,
  formatSalary,
  validateJob,
} from "@/lib/jobFormat";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

function text(value) {
  return value === null || value === undefined ? "" : String(value);
}

// Turns a job from the database into form values
function toFormValues(job, profile) {
  return {
    job_title: text(job?.job_title),
    company_name: text(job?.company_name ?? profile?.company_name),
    location: text(job?.location),
    workplace_type: text(job?.workplace_type) || "On-site",
    employment_type: text(job?.employment_type) || "Full-time",
    experience: text(job?.experience) || "Entry level",
    education: text(job?.education),
    openings: job ? text(job.openings) : "1",
    application_deadline: text(job?.application_deadline),
    salary_min: text(job?.salary_min),
    salary_max: text(job?.salary_max),
    salary_period: text(job?.salary_period) || "month",
    description: text(job?.description),
    responsibilities: text(job?.responsibilities),
    requirements: text(job?.requirements),
    skills: text(job?.skills),
    benefits: text(job?.benefits),
    apply_method: job?.apply_method === "external" ? "external" : "internal",
    apply_url: text(job?.apply_url),
  };
}

function Field({ id, label, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

// mode = "create" or "edit". For edit, pass the existing job.
export default function JobForm({ mode, job }) {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [v, setV] = useState(() => toFormValues(job, profile));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => setV((current) => ({ ...current, [name]: e.target.value }));

  // keep an old experience value selectable when editing
  const experienceOptions = EXPERIENCE_LEVELS.includes(v.experience) || !v.experience
    ? EXPERIENCE_LEVELS
    : [v.experience, ...EXPERIENCE_LEVELS];

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const found = validateJob(v, { isNew: mode === "create" });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const internal = v.apply_method === "internal";
    const min = v.salary_min === "" ? null : Number(v.salary_min);
    const max = v.salary_max === "" ? null : Number(v.salary_max);
    const hasPay = min !== null || max !== null;

    const fields = {
      job_title: v.job_title.trim(),
      company_name: v.company_name.trim(),
      location: v.location.trim(),
      workplace_type: v.workplace_type,
      employment_type: v.employment_type,
      experience: v.experience || null,
      education: v.education.trim() || null,
      openings: v.openings === "" ? null : Number(v.openings),
      application_deadline: v.application_deadline || null,
      salary_min: min,
      salary_max: max,
      salary_period: hasPay ? v.salary_period : null,
      salary: formatSalary(min, max, v.salary_period),
      description: v.description.trim(),
      responsibilities: v.responsibilities.trim() || null,
      requirements: v.requirements.trim() || null,
      skills: v.skills.trim() || null,
      benefits: v.benefits.trim() || null,
      apply_method: internal ? "internal" : "external",
      apply_url: internal ? null : v.apply_url.trim(),
      source_url: internal ? null : v.apply_url.trim(),
    };

    setSaving(true);
    let result;
    if (mode === "edit") {
      result = await supabase.from("jobs").update(fields).eq("id", job.id).select("id");
    } else {
      result = await supabase.from("jobs").insert({
        ...fields,
        source_name: "Stellenportal",
        posted_by: user.id,
        posted_at: new Date().toISOString(),
        is_active: true,
      }).select("id");
    }

    if (result.error) {
      setFormError(friendlyDbError(result.error));
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (mode === "edit" && (!result.data || result.data.length === 0)) {
      setFormError("The job was not updated. You may not have permission to edit it.");
      setSaving(false);
      return;
    }

    router.push(role === "admin" ? "/admin" : "/employer");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <ErrorBox>{formError}</ErrorBox>

      <Section title="Job details" subtitle="The basics candidates see first.">
        <div className="sm:col-span-2">
          <Field id="job_title" label="Job title" required error={errors.job_title}>
            <input id="job_title" className={inputClass} value={v.job_title} onChange={set("job_title")} placeholder="e.g. Frontend Developer" />
          </Field>
        </div>
        <Field id="company_name" label="Company name" required error={errors.company_name}>
          <input id="company_name" className={inputClass} value={v.company_name} onChange={set("company_name")} />
        </Field>
        <Field id="location" label="Location" required error={errors.location} hint="City and state, or Remote">
          <input id="location" className={inputClass} value={v.location} onChange={set("location")} placeholder="e.g. Pune, Maharashtra" />
        </Field>
        <Field id="workplace_type" label="Workplace type">
          <select id="workplace_type" className={inputClass} value={v.workplace_type} onChange={set("workplace_type")}>
            {WORKPLACE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field id="employment_type" label="Job type" required error={errors.employment_type}>
          <select id="employment_type" className={inputClass} value={v.employment_type} onChange={set("employment_type")}>
            {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field id="experience" label="Experience level">
          <select id="experience" className={inputClass} value={v.experience} onChange={set("experience")}>
            {experienceOptions.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field id="education" label="Education" hint="Optional, e.g. BCA, B.Tech or any graduate">
          <input id="education" className={inputClass} value={v.education} onChange={set("education")} />
        </Field>
      </Section>

      <Section title="Pay and hiring" subtitle="Showing pay gets more applications. Leave blank if not disclosed.">
        <Field id="salary_min" label="Minimum pay (₹)" error={errors.salary_min}>
          <input id="salary_min" type="number" min="0" inputMode="numeric" className={inputClass} value={v.salary_min} onChange={set("salary_min")} placeholder="e.g. 10000" />
        </Field>
        <Field id="salary_max" label="Maximum pay (₹)" error={errors.salary_max}>
          <input id="salary_max" type="number" min="0" inputMode="numeric" className={inputClass} value={v.salary_max} onChange={set("salary_max")} placeholder="e.g. 15000" />
        </Field>
        <Field id="salary_period" label="Pay period">
          <select id="salary_period" className={inputClass} value={v.salary_period} onChange={set("salary_period")}>
            {SALARY_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field id="openings" label="Number of openings" error={errors.openings}>
          <input id="openings" type="number" min="1" className={inputClass} value={v.openings} onChange={set("openings")} />
        </Field>
        <Field id="application_deadline" label="Application deadline" error={errors.application_deadline} hint="Optional">
          <input id="application_deadline" type="date" className={inputClass} value={v.application_deadline} onChange={set("application_deadline")} />
        </Field>
      </Section>

      <section className={`${cardClass} space-y-5 p-5 sm:p-6`}>
        <div>
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="mt-1 text-sm text-slate-600">Describe the role clearly, like on LinkedIn or Indeed.</p>
        </div>
        <Field id="description" label="About the job" required error={errors.description} hint="What the role is and what the team does.">
          <textarea id="description" rows={6} className={inputClass} value={v.description} onChange={set("description")} />
        </Field>
        <Field id="responsibilities" label="Responsibilities" hint="One per line">
          <textarea id="responsibilities" rows={5} className={inputClass} value={v.responsibilities} onChange={set("responsibilities")} placeholder={"Build responsive pages\nFix bugs and write tests"} />
        </Field>
        <Field id="requirements" label="Requirements and qualifications" hint="One per line">
          <textarea id="requirements" rows={5} className={inputClass} value={v.requirements} onChange={set("requirements")} placeholder={"Knowledge of JavaScript and React\nGood communication"} />
        </Field>
        <Field id="skills" label="Skills" hint="Separate with commas, e.g. React, Node.js, SQL">
          <input id="skills" className={inputClass} value={v.skills} onChange={set("skills")} />
        </Field>
        <Field id="benefits" label="Benefits and perks" hint="One per line">
          <textarea id="benefits" rows={4} className={inputClass} value={v.benefits} onChange={set("benefits")} placeholder={"Certificate\nFlexible hours"} />
        </Field>
      </section>

      <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
        <h2 className="text-lg font-semibold">How to apply</h2>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="How candidates apply">
          {[
            { value: "internal", title: "On Stellenportal", text: "Candidates upload a CV here and you review them in your dashboard." },
            { value: "external", title: "On my own website", text: "Apply Now sends candidates to a link you provide." },
          ].map((o) => {
            const active = v.apply_method === o.value;
            return (
              <button key={o.value} type="button" role="radio" aria-checked={active}
                onClick={() => setV((c) => ({ ...c, apply_method: o.value }))}
                className={`rounded-xl border p-4 text-left ${active ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                <span className="block font-semibold">{o.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{o.text}</span>
              </button>
            );
          })}
        </div>
        {v.apply_method === "external" && (
          <Field id="apply_url" label="Application link" required error={errors.apply_url}>
            <input id="apply_url" type="url" className={inputClass} value={v.apply_url} onChange={set("apply_url")} placeholder="https://yourcompany.com/careers/job-1" />
          </Field>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Publish job"}
        </button>
        <button type="button" disabled={saving} onClick={() => router.back()} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}
