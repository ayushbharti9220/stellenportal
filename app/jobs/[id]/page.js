import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { toList, toSkills } from "@/lib/jobFormat";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const job = await getJobById(id);
    if (job) {
      return { title: `${job.job_title} at ${job.company_name} | Stellenportal` };
    }
  } catch {}
  return { title: "Job | Stellenportal" };
}

function ListSection({ title, items }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-slate-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

// In Next.js 15+, params is a Promise, so we await it.
export default async function JobDetailsPage({ params }) {
  const { id } = await params;

  let job;
  try {
    job = await getJobById(id);
  } catch {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Could not load this job</h1>
        <p className="mt-2 text-slate-600">Please try again in a moment.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Back to all jobs
        </Link>
      </div>
    );
  }

  if (!job) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const closed = Boolean(job.application_deadline) && job.application_deadline < today;
  const internal = job.apply_method === "internal";
  const externalLink = job.apply_url || job.source_url;
  const dateLabel = job.posted_at ? "Posted" : "Added";

  const details = [
    ["Location", job.location],
    ["Workplace", job.workplace_type],
    ["Pay", job.salary],
    ["Job type", job.employment_type],
    ["Experience", job.experience],
    ["Education", job.education],
    ["Openings", job.openings],
    ["Apply by", job.application_deadline ? formatDate(job.application_deadline) : null],
    ["Source", internal ? "Stellenportal" : job.source_name],
    [dateLabel, formatDate(job.posted_at || job.imported_at)],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const skills = toSkills(job.skills);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-slate-600 hover:text-blue-700">
        Back to all jobs
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{job.job_title}</h1>
          <p className="mt-1 text-slate-600">{job.company_name}</p>

          <h2 className="mt-8 text-lg font-semibold">About the job</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
            {job.description || "No description provided."}
          </p>

          <ListSection title="Responsibilities" items={toList(job.responsibilities)} />
          <ListSection title="Requirements" items={toList(job.requirements)} />

          {skills.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <ListSection title="Benefits" items={toList(job.benefits)} />
        </article>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <dl className="space-y-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          {internal ? (
            closed ? (
              <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
                Applications are closed
              </p>
            ) : (
              <>
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="mt-6 block rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  Apply Now
                </Link>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  You will need a free job seeker account. You can upload your CV on the next page.
                </p>
              </>
            )
          ) : externalLink ? (
            <>
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Apply Now
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                You will be taken to {job.source_name} to complete your application.
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No application link is available for this job.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
