import Link from "next/link";
import JobBoard from "@/components/JobBoard";

const steps = [
  {
    title: "Search",
    text: "Look up jobs by title, company, location or skill.",
  },
  {
    title: "Read the details",
    text: "Open a listing to see the full description, pay and requirements.",
  },
  {
    title: "Apply on the original site",
    text: "Apply Now takes you to the employer or job portal that posted it.",
  },
];

export default function HomePage() {
  return (
    <>
      <JobBoard />

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Looking for a job?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Create a free account, apply in a few clicks and upload your CV once for each application.
            </p>
            <Link href="/signup" className="mt-5 inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
              Sign up as a job seeker
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Hiring for your company?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Post a job with full details, receive applications with CVs, and manage candidates in one place.
            </p>
            <Link href="/signup?role=employer" className="mt-5 inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400">
              Sign up as an employer
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title}>
                <p className="text-sm font-medium text-blue-700">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
