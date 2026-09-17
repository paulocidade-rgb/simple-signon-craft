CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY "Owners can manage extensions" ON public.extensions;
CREATE POLICY "Owners can manage extensions" ON public.extensions FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'owner')) WITH CHECK (private.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION private.provision_current_user()
RETURNS TABLE(balance INTEGER, role public.app_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id UUID := auth.uid(); v_email TEXT := lower(COALESCE(auth.jwt() ->> 'email', '')); v_role public.app_role;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_role := CASE WHEN v_email = 'paulomanus304@gmail.com' THEN 'owner'::public.app_role ELSE 'user'::public.app_role END;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_user_id, v_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role WHERE public.user_roles.role <> 'owner';
  INSERT INTO public.user_credits(user_id, balance) VALUES (v_user_id, 20) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_transactions(user_id, amount, type, description, reference_id)
  VALUES (v_user_id, 20, 'welcome', 'Créditos de boas-vindas', 'welcome:' || v_user_id::text)
  ON CONFLICT (reference_id) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN QUERY SELECT c.balance, r.role FROM public.user_credits c JOIN public.user_roles r USING (user_id) WHERE c.user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.consume_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_amount <= 0 OR p_amount > 10000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF char_length(p_description) NOT BETWEEN 2 AND 300 THEN RAISE EXCEPTION 'invalid_description'; END IF;
  IF private.has_role(p_user_id, 'owner') THEN
    INSERT INTO public.credit_transactions(user_id, amount, type, description) VALUES (p_user_id, 0, 'owner_bypass', p_description);
    RETURN true;
  END IF;
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN RETURN false; END IF;
  UPDATE public.user_credits SET balance = balance - p_amount WHERE user_id = p_user_id;
  INSERT INTO public.credit_transactions(user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, CASE WHEN p_amount = 5 THEN 'github_commit' ELSE 'extension_install' END, p_description);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION private.install_extension(p_extension_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id UUID := auth.uid(); v_ok BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.licenses WHERE user_id = v_user_id AND extension_id = p_extension_id AND status = 'active') THEN RETURN true; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.extensions WHERE id = p_extension_id AND is_published) THEN RAISE EXCEPTION 'extension_not_found'; END IF;
  v_ok := private.consume_credits(v_user_id, 10, 'Instalação de extensão');
  IF NOT v_ok THEN RETURN false; END IF;
  INSERT INTO public.licenses(user_id, extension_id) VALUES (v_user_id, p_extension_id)
  ON CONFLICT (user_id, extension_id) DO UPDATE SET status = 'active', updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$ SELECT private.has_role(_user_id, _role) $$;
CREATE OR REPLACE FUNCTION public.provision_current_user()
RETURNS TABLE(balance INTEGER, role public.app_role) LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$ SELECT * FROM private.provision_current_user() $$;
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$ SELECT private.consume_credits(p_user_id, p_amount, p_description) $$;
CREATE OR REPLACE FUNCTION public.install_extension(p_extension_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$ SELECT private.install_extension(p_extension_id) $$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.provision_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION private.consume_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.install_extension(UUID) TO authenticated;