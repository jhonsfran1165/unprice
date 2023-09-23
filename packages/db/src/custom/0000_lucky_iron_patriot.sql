-- Custom SQL migration file, put you code below! --

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apikey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion ENABLE ROW LEVEL SECURITY;

-- ALTER TABLE public.project FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.workspace FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.apikey FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.ingestion FORCE ROW LEVEL SECURITY;


-- project
CREATE POLICY "everyone can insert" ON public.project FOR INSERT TO neon_superuser WITH CHECK (true);

CREATE POLICY "organization member can select" ON public.project FOR SELECT TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can delete" ON public.project FOR DELETE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can update" ON public.project FOR UPDATE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id) WITH CHECK (current_setting('app.tenantId'::text, true) = tenant_id);


-- workspace
CREATE POLICY "everyone can insert" ON public.workspace FOR INSERT TO neon_superuser WITH CHECK (true);

CREATE POLICY "organization member can select" ON public.workspace FOR SELECT TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can delete" ON public.workspace FOR DELETE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can update" ON public.workspace FOR UPDATE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id) WITH CHECK (current_setting('app.tenantId'::text, true) = tenant_id);


-- apikey
CREATE POLICY "everyone can insert" ON public.apikey FOR INSERT TO neon_superuser WITH CHECK (true);

CREATE POLICY "organization member can select" ON public.apikey FOR SELECT TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can delete" ON public.apikey FOR DELETE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can update" ON public.apikey FOR UPDATE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id) WITH CHECK (current_setting('app.tenantId'::text, true) = tenant_id);


-- ingestion
CREATE POLICY "everyone can insert" ON public.ingestion FOR INSERT TO neon_superuser WITH CHECK (true);

CREATE POLICY "organization member can select" ON public.ingestion FOR SELECT TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can delete" ON public.ingestion FOR DELETE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id);

CREATE POLICY "organization member can update" ON public.ingestion FOR UPDATE TO neon_superuser USING (current_setting('app.tenantId'::text, true) = tenant_id) WITH CHECK (current_setting('app.tenantId'::text, true) = tenant_id);
