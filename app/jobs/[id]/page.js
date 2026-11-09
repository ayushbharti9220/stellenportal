import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/jobs";
import { formatDate } from "@/lib/format";

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

// In Next.js 15+, params is a Promise, so we await it.
export default async function JobDetailsPage({ params }) {
  const { id } = await params;

  let job;
  try {
    job = await getJobById(id);
  } catch (err) {
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

  const applyLink = job.apply_url || job.source_url;
  const dateLabel = job.posted_at ? "Posted" : "Added";
  const dateValue = formatDate(job.posted_at || job.imported_at);

  const details = [
    ["Location", job.location],
    ["Pay", job.salary],
    ["Type", job.employment_type],
    ["Experience", job.experience],
    ["Source", job.source_name],
    [dateLabel, dateValue],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-slate-600 hover:text-blue-700">
        Back to all jobs
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {job.job_title}
          </h1>
          <p className="mt-1 text-slate-600">{job.company_name}</p>

          <h2 className="mt-8 text-lg font-semibold">Description</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
            {job.description || "No description provided."}
          </p>
        </article>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
          <dl className="space-y-4">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{value || "Not stated"}</dd>
              </div>
            ))}
          </dl>

          {applyLink ? (
            <>
              <a
                href={applyLink}
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
            <p className="mt-6 text-sm text-slate-500">
              No application link is available for this job.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
