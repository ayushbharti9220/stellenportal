import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight">Stellenportal</p>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Jobs and internships from different portals, in one place.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/#jobs" className="text-slate-600 hover:text-slate-900">Jobs</Link>
            <Link href="/#how-it-works" className="text-slate-600 hover:text-slate-900">How it works</Link>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            Stellenportal is an independent college project. It is not affiliated
            with LinkedIn, Indeed, Naukri or Internshala. Applications are
            completed on the original source website.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Stellenportal</p>
        </div>
      </div>
    </footer>
  );
}
