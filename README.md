# Stellenportal

A job portal built with Next.js, Tailwind CSS and Supabase (PostgreSQL, Auth, Storage).
Job seekers browse and search jobs and apply with a CV. Employers and HR teams post jobs and review applicants.
Jobs from other portals can be imported by an admin, and their Apply Now button opens the original website.

## Status
- Phase 1-4: database, frontend, API, search, filters, Load More: done
- Phase 5: accounts (job seeker / employer / admin), post jobs, apply with CV upload, admin dashboard, CSV import: done
- Next: polish, SEO, deployment on Vercel

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and add your Supabase URL and publishable key.
3. In Supabase > SQL Editor run, in order:
   `database/schema.sql` (if needed), `database/rls-policy.sql`, `database/seed-sample-jobs.sql`, `database/phase5-migration.sql`
4. `npm run dev` and open http://localhost:3000
5. Sign up on the website, then make yourself admin (last section of `database/phase5-migration.sql`).

## Deployment (Vercel + Supabase)
1. Push the code to GitHub. Never commit `.env.local`.
2. On vercel.com choose **Add New > Project**, import the repository (framework: Next.js).
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before the first deploy.
4. In Supabase > Authentication > URL Configuration set the Site URL to the Vercel address and add it to the Redirect URLs.
5. `vercel.json` runs `/api/keepalive` once a day so the free Supabase project is not paused for inactivity.

Live site: _add your Vercel link here_

## Account types
| Type | Can do |
|---|---|
| Job seeker | Browse jobs, apply with a CV, see own applications |
| Employer / HR | Post, edit, deactivate, delete own jobs; see applicants and CVs of own jobs; change application status |
| Admin | Everything, plus CSV import and the admin dashboard |

Security is enforced by Row Level Security in the database (see `database/phase5-migration.sql`), not only by the pages.

## Structure
```
app/
  page.js                       homepage (search, filters, Load More)
  login, signup                 accounts
  jobs/[id]                     job details; jobs/[id]/apply = apply with CV
  applications                  job seeker: my applications
  employer/                     my jobs; jobs/new; jobs/[id]/edit; jobs/[id]/applicants
  admin/                        dashboard; admin/import = CSV import
  api/jobs                      public API: list/search, filters, single job
components/                     AuthProvider, RequireRole, Navbar, JobForm, JobBoard, JobCard ...
lib/                            supabase.js (server), supabaseBrowser.js, jobs.js, csv.js, jobFormat.js ...
database/                       SQL files
```

Stellenportal is an independent college project and is not affiliated with LinkedIn, Indeed, Naukri or Internshala.
