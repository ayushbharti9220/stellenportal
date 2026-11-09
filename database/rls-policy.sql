-- Row Level Security: visitors may READ active jobs only.
-- Nobody can insert, update or delete using the public key.
-- Run in Supabase > SQL Editor. Safe to run more than once.
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active jobs" ON public.jobs;

CREATE POLICY "Public can read active jobs"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);
