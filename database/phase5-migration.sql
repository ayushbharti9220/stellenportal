-- =====================================================================
-- STELLENPORTAL  Phase 5 database update
-- Run this ONCE in Supabase > SQL Editor > New query > Run.
-- It is safe to run again: it never deletes your jobs or users.
--
-- It adds:
--   1. profiles       (one row per user, with a role: seeker / employer / admin)
--   2. new job fields (workplace type, pay range, requirements, skills ...)
--   3. applications   (job seekers applying with a CV)
--   4. a private storage bucket "cvs" for CV files
--   5. security rules (Row Level Security) for all of the above
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PROFILES: links auth.users to a role and company details
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'seeker' CHECK (role IN ('seeker', 'employer', 'admin')),
    full_name TEXT,
    phone TEXT,
    company_name TEXT,
    company_website TEXT,
    company_size TEXT,
    industry TEXT,
    company_location TEXT,
    company_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper functions used by the security rules.
-- SECURITY DEFINER lets them read profiles without triggering the profiles rules again.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), FALSE)
$$;

CREATE OR REPLACE FUNCTION public.is_employer()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE((SELECT role IN ('employer', 'admin') FROM public.profiles WHERE id = auth.uid()), FALSE)
$$;

-- Creates a profile automatically whenever someone signs up.
-- Only 'employer' or 'seeker' can be chosen at sign-up. Nobody can sign up as admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, company_name)
    VALUES (
        NEW.id,
        CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'employer' THEN 'employer' ELSE 'seeker' END,
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data ->> 'company_name'), '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Give a profile to users that already exist (for example an admin you created earlier)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'seeker', NULLIF(TRIM(raw_user_meta_data ->> 'full_name'), '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Security rules for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin reads all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin reads all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Users may edit their details but NEVER their own role.
REVOKE ALL ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, company_name, company_website, company_size, industry,
              company_location, company_description) ON public.profiles TO authenticated;


-- ---------------------------------------------------------------------
-- 2. JOBS: new fields (existing jobs and data are kept)
-- ---------------------------------------------------------------------
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS workplace_type TEXT,
    ADD COLUMN IF NOT EXISTS salary_min INTEGER,
    ADD COLUMN IF NOT EXISTS salary_max INTEGER,
    ADD COLUMN IF NOT EXISTS salary_period TEXT,
    ADD COLUMN IF NOT EXISTS responsibilities TEXT,
    ADD COLUMN IF NOT EXISTS requirements TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT,
    ADD COLUMN IF NOT EXISTS benefits TEXT,
    ADD COLUMN IF NOT EXISTS education TEXT,
    ADD COLUMN IF NOT EXISTS openings INTEGER,
    ADD COLUMN IF NOT EXISTS application_deadline DATE,
    ADD COLUMN IF NOT EXISTS apply_method TEXT NOT NULL DEFAULT 'external'
        CHECK (apply_method IN ('internal', 'external'));

CREATE INDEX IF NOT EXISTS jobs_posted_by_idx ON public.jobs (posted_by);

-- Security rules for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers read own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers add own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers edit own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin full access to jobs" ON public.jobs;
-- (old email-based admin policies from earlier instructions, if you created them)
DROP POLICY IF EXISTS "Admin can read all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can add jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can edit jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;

-- Everyone (even logged out) can read ACTIVE jobs
CREATE POLICY "Public can read active jobs" ON public.jobs
    FOR SELECT TO anon, authenticated USING (is_active = TRUE);

-- Employers manage only the jobs they posted
CREATE POLICY "Employers read own jobs" ON public.jobs
    FOR SELECT TO authenticated USING (posted_by = auth.uid());

CREATE POLICY "Employers add own jobs" ON public.jobs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_employer() AND posted_by = auth.uid());

CREATE POLICY "Employers edit own jobs" ON public.jobs
    FOR UPDATE TO authenticated
    USING (public.is_employer() AND posted_by = auth.uid())
    WITH CHECK (public.is_employer() AND posted_by = auth.uid());

CREATE POLICY "Employers delete own jobs" ON public.jobs
    FOR DELETE TO authenticated
    USING (public.is_employer() AND posted_by = auth.uid());

-- Admin can do everything
CREATE POLICY "Admin full access to jobs" ON public.jobs
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ---------------------------------------------------------------------
-- 3. APPLICATIONS: job seekers applying to jobs posted on Stellenportal
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cover_letter TEXT,
    cv_path TEXT,
    cv_filename TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS applications_job_idx ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS applications_applicant_idx ON public.applications (applicant_id);

-- Is the logged-in user the employer who posted this job?
CREATE OR REPLACE FUNCTION public.owns_job(p_job_id BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = p_job_id AND posted_by = auth.uid())
$$;

-- May the logged-in user open this CV file? (the owner, the employer of that job, or admin)
CREATE OR REPLACE FUNCTION public.can_view_cv(p_path TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_admin() OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.cv_path = p_path AND j.posted_by = auth.uid()
    )
$$;

-- Can the logged-in user apply to this job? (active, applied on Stellenportal, deadline not passed, not their own job)
CREATE OR REPLACE FUNCTION public.can_apply_to(p_job_id BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = p_job_id
          AND j.is_active = TRUE
          AND j.apply_method = 'internal'
          AND (j.application_deadline IS NULL OR j.application_deadline >= CURRENT_DATE)
          AND j.posted_by IS DISTINCT FROM auth.uid()
    )
$$;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants read own applications" ON public.applications;
DROP POLICY IF EXISTS "Applicants create own applications" ON public.applications;
DROP POLICY IF EXISTS "Employers read applications for own jobs" ON public.applications;
DROP POLICY IF EXISTS "Employers update application status" ON public.applications;
DROP POLICY IF EXISTS "Admin full access to applications" ON public.applications;

CREATE POLICY "Applicants read own applications" ON public.applications
    FOR SELECT TO authenticated USING (applicant_id = auth.uid());

CREATE POLICY "Applicants create own applications" ON public.applications
    FOR INSERT TO authenticated
    WITH CHECK (applicant_id = auth.uid() AND public.can_apply_to(job_id));

CREATE POLICY "Employers read applications for own jobs" ON public.applications
    FOR SELECT TO authenticated USING (public.owns_job(job_id));

CREATE POLICY "Employers update application status" ON public.applications
    FOR UPDATE TO authenticated
    USING (public.owns_job(job_id)) WITH CHECK (public.owns_job(job_id));

CREATE POLICY "Admin full access to applications" ON public.applications
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Employers may change ONLY the status of an application, nothing else.
REVOKE ALL ON public.applications FROM anon;
REVOKE ALL ON public.applications FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;
GRANT UPDATE (status) ON public.applications TO authenticated;


-- ---------------------------------------------------------------------
-- 4. STORAGE: private bucket for CV files (PDF / DOC / DOCX, max 5 MB)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cvs', 'cvs', FALSE, 5242880,
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE
    SET public = FALSE,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "CV upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "CV read own files" ON storage.objects;
DROP POLICY IF EXISTS "CV read by employer or admin" ON storage.objects;
DROP POLICY IF EXISTS "CV delete own files" ON storage.objects;

-- Files are stored as  <user id>/<file name>, so each user only touches their own folder.
CREATE POLICY "CV upload to own folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "CV read own files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "CV read by employer or admin" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'cvs' AND public.can_view_cv(name));

CREATE POLICY "CV delete own files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);


-- ---------------------------------------------------------------------
-- 5. MAKE YOURSELF ADMIN (run this part AFTER you have signed up on the website)
--    Replace the email, then run just this one statement.
-- ---------------------------------------------------------------------
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
