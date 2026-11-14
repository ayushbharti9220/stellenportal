# Stellenportal

A full-stack job portal built with Next.js, Tailwind CSS, and Supabase. Job seekers can search listings and apply with their CV, employers can post roles and review candidates, and admins can bulk-import external listings via CSV.

**Live Site:** [stellenportal-one.vercel.app](https://stellenportal-one.vercel.app)

---

## Features

- **Job Seeker:** Search and filter active openings, view job details, upload a CV, and track application status.
- **Employer / HR:** Create, edit, and close job postings, review applicants, download CVs, and update candidate statuses.
- **Admin Dashboard:** Manage platform-wide listings and import jobs from external portals via CSV (imported listings redirect applicants to the original source URL).
- **Database-Level Security:** Role-based access (`job_seeker`, `employer`, `admin`) is enforced directly in PostgreSQL using Row Level Security (RLS) policies rather than relying solely on frontend route guards.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend & Auth:** Next.js API Routes, Supabase Auth
- **Database & Storage:** Supabase PostgreSQL (with RLS) and Supabase Storage (for CVs)
- **Deployment:** Vercel (including a daily `/api/keepalive` cron job configured in `vercel.json`)

## Project Structure

```text
├── app/
│   ├── admin/          # Admin dashboard and CSV import tools
│   ├── api/jobs/       # Public API endpoints for listing, searching, and filtering jobs
│   ├── applications/   # Job seeker application tracking
│   ├── employer/       # Job management and applicant review views
│   ├── jobs/[id]/      # Job detail and CV application flow
│   ├── login/          # Authentication pages
│   └── page.js         # Main job board with search, filters, and Load More
├── components/         # AuthProvider, RequireRole, Navbar, JobBoard, JobForm, JobCard
├── database/           # SQL schema, RLS policies, seed data, and role migrations
└── lib/                # Supabase clients, query helpers, CSV parser, and formatters
