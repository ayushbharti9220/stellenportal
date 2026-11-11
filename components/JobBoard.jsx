"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { primaryBtn, secondaryBtn } from "@/lib/ui";
import SearchBar from "./SearchBar";
import JobFilters from "./JobFilters";
import JobCard from "./JobCard";

const PAGE_SIZE = 6;
const TYPES = ["All", "Internship", "Full-time", "Part-time", "Contract"];

export default function JobBoard() {
  const { role } = useAuth();
  const hireHref = role === "employer" || role === "admin" ? "/employer/jobs/new" : "/signup?role=employer";

  // What the user typed / selected
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("All");

  // Data from the API
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState([]);

  // Status
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Builds the URL for /api/jobs
  function buildUrl(pageNumber) {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("search", debouncedQuery);
    if (location) params.set("location", location);
    if (type !== "All") params.set("type", type);
    params.set("page", pageNumber);
    params.set("pageSize", PAGE_SIZE);
    return `/api/jobs?${params.toString()}`;
  }

  // 1. Load location options once
  useEffect(() => {
    fetch("/api/jobs/filters")
      .then((res) => res.json())
      .then((data) => setLocations(data.locations || []))
      .catch(() => setLocations([]));
  }, []);

  // 2. Wait 400ms after the user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // 3. Load page 1 whenever the search or a filter changes
  useEffect(() => {
    const controller = new AbortController();

    async function loadFirstPage() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(buildUrl(1), { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.details || data.error || "Request failed");
        setJobs(data.jobs);
        setTotal(data.total);
        setPage(1);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return; // a newer search replaced this one
        console.error(err);
        setError("Could not load jobs. Please try again.");
        setLoading(false);
      }
    }

    loadFirstPage();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, location, type]);

  // 4. Load More: fetch the next page and add it to the list
  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(page + 1));
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setJobs((current) => [...current, ...data.jobs]);
      setPage(page + 1);
    } catch {
      setError("Could not load more jobs. Please try again.");
    }
    setLoadingMore(false);
  }

  function clearAll() {
    setQuery("");
    setDebouncedQuery("");
    setLocation("");
    setType("All");
  }

  const hasFilters = query || location || type !== "All";
  const hasMore = jobs.length < total;

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
            Find your next job or internship in one place
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            Browse listings from different portals, read the details here, and
            apply on the original website.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#jobs" className={primaryBtn}>Find a job</a>
            <Link href={hireHref} className={secondaryBtn}>I am hiring</Link>
          </div>
          <div className="mt-8 max-w-3xl">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              location={location}
              onLocationChange={setLocation}
              locations={locations}
            />
          </div>
        </div>
      </section>

      <section id="jobs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <JobFilters types={TYPES} selected={type} onSelect={setType} />
          <p className="text-sm text-slate-600" aria-live="polite">
            {loading ? "Searching..." : `${total} ${total === 1 ? "job" : "jobs"} found`}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-800 hover:border-slate-400 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more jobs"}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  Showing {jobs.length} of {total}
                </p>
              </div>
            )}
          </>
        ) : (
          !error && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="text-lg font-semibold">No jobs match your search</h3>
              <p className="mt-1 text-sm text-slate-600">
                Try a different keyword, or remove some filters.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          )
        )}
      </section>
    </>
  );
}
