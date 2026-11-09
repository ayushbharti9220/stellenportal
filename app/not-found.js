import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">This job is no longer available</h1>
      <p className="mt-2 text-slate-600">
        It may have expired or the link may be wrong.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Browse all jobs
      </Link>
    </div>
  );
}
