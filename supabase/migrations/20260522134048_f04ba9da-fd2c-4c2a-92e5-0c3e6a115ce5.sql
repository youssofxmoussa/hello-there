
-- explicit deny-all for server-only tables (RLS enabled but no public policy)
CREATE POLICY audit_logs_no_access ON public.audit_logs FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY rate_limits_no_access ON public.rate_limits FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- harden trigger function: pin search_path & revoke public execute
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
