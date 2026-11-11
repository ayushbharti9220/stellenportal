"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { primaryBtn, secondaryBtn } from "@/lib/ui";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile, role, loading, signOut } = useAuth();
  const router = useRouter();

  // Menu links change with the type of user
  const links = [
    { href: "/", label: "Home" },
    { href: "/#jobs", label: "Jobs" },
  ];
  if (role === "seeker") links.push({ href: "/applications", label: "My applications" });
  if (role === "employer" || role === "admin") {
    links.push({ href: "/employer", label: "My jobs" });
    links.push({ href: "/employer/jobs/new", label: "Post a job" });
  }
  if (role === "admin") links.push({ href: "/admin", label: "Admin" });
  if (!user) {
    links.push({ href: "/#how-it-works", label: "How it works" });
    links.push({ href: "/signup?role=employer", label: "For employers" });
  }

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const name = profile?.full_name || user?.email || "";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
            S
          </span>
          <span className="text-lg font-semibold tracking-tight">Stellenportal</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
              {link.label}
            </Link>
          ))}

          {!loading && !user && (
            <div className="flex items-center gap-2">
              <Link href="/login" className={secondaryBtn}>Log in</Link>
              <Link href="/signup" className={primaryBtn}>Sign up</Link>
            </div>
          )}
          {!loading && user && (
            <div className="flex items-center gap-3">
              <span className="max-w-40 truncate text-sm text-slate-500" title={name}>{name}</span>
              <button type="button" onClick={handleSignOut} className={secondaryBtn}>Log out</button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          {!loading && !user && (
            <div className="mt-2 flex gap-2 px-3 pb-1">
              <Link href="/login" onClick={() => setOpen(false)} className={secondaryBtn}>Log in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className={primaryBtn}>Sign up</Link>
            </div>
          )}
          {!loading && user && (
            <div className="mt-2 border-t border-slate-100 px-3 pt-3">
              <p className="mb-2 truncate text-xs text-slate-500">{name}</p>
              <button type="button" onClick={handleSignOut} className={secondaryBtn}>Log out</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
