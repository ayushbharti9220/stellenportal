"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Loading, Message } from "./PageState";

// Wrap a page with <RequireRole roles={["employer"]}> to protect it.
// Not logged in -> sent to /login. Wrong account type -> a clear message.
// (The database also enforces this with Row Level Security.)
export default function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return <Loading />;

  if (!role) {
    return (
      <Message
        title="Your profile was not found"
        text="Run database/phase5-migration.sql in the Supabase SQL Editor, then log in again."
        href="/"
        action="Go to homepage"
      />
    );
  }

  if (!roles.includes(role)) {
    return (
      <Message
        title="This page is not for your account type"
        text={
          role === "seeker"
            ? "This area is for employers. Create an employer account to post jobs."
            : "Your account cannot open this page."
        }
        href="/"
        action="Go to homepage"
      />
    );
  }

  return children;
}
