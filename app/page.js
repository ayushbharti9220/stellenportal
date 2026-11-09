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
