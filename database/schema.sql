-- Run once in Supabase > SQL Editor (skip if the table already exists).
CREATE TABLE IF NOT EXISTS public.jobs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    salary TEXT,
    experience TEXT,
    employment_type TEXT,
    source_name TEXT NOT NULL,
    source_job_id TEXT,
    source_url TEXT,
    apply_url TEXT,
    posted_at TIMESTAMPTZ,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (source_name, source_job_id)
);
