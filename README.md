# Stellenportal

A job and internship aggregator built with Next.js, Tailwind CSS and Supabase (PostgreSQL).
Users browse and search listings, read the details, and click **Apply Now** to apply on the original website.

## Status
- Phase 1 Database: done
- Phase 2 Frontend: done
- Phase 3 Database connection: done
- Phase 4 Search, filters, Load More: done
- Phase 5 Admin panel: next

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase URL and publishable key.
3. In Supabase > SQL Editor run, in order: `database/schema.sql` (if needed), `database/rls-policy.sql`, `database/seed-sample-jobs.sql`.
4. `npm run dev` and open http://localhost:3000

## API
- `GET /api/jobs?search=&location=&type=&page=&pageSize=` search, filter, paginate
- `GET /api/jobs/filters` location options
- `GET /api/jobs/:id` one job

## Structure
```
app/            pages and API routes
  api/jobs/     route.js, filters/route.js, [id]/route.js
  jobs/[id]/    job details page
components/     Navbar, Footer, JobBoard, JobCard, SearchBar, JobFilters
lib/            supabase.js (client), jobs.js (queries), format.js
database/       schema.sql, rls-policy.sql, seed-sample-jobs.sql
```

Stellenportal is an independent college project and is not affiliated with LinkedIn, Indeed, Naukri or Internshala.
