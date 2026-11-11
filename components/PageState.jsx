import Link from "next/link";
import { primaryBtn } from "@/lib/ui";

export function Loading({ text = "Loading..." }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-slate-500 sm:px-6" role="status">
      {text}
    </div>
  );
}

export function Message({ title, text, href, action }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {text && <p className="mt-2 text-slate-600">{text}</p>}
      {href && (
        <Link href={href} className={`${primaryBtn} mt-6`}>
          {action || "Go back"}
        </Link>
      )}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      {children}
    </div>
  );
}

export function SuccessBox({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
      {children}
    </div>
  );
}
