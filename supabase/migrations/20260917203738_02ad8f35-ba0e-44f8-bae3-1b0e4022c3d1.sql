REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.provision_current_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.install_extension(UUID) FROM PUBLIC, anon;
CREATE POLICY "GitHub connections are server only" ON public.github_connections FOR ALL TO authenticated USING (false) WITH CHECK (false);