CREATE TYPE public.app_role AS ENUM ('owner', 'user');

CREATE TABLE public.extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  price INTEGER NOT NULL CHECK (price >= 0),
  billing_period TEXT NOT NULL DEFAULT 'one_time' CHECK (billing_period IN ('one_time', 'monthly')),
  icon_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('interface', 'design', 'marketing')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.extensions TO anon, authenticated;
GRANT ALL ON public.extensions TO service_role;
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published extensions are public" ON public.extensions FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 20 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credits" ON public.user_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'purchase', 'extension_install', 'github_commit', 'owner_bypass', 'refund')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 2 AND 300),
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX credit_transactions_user_created_idx ON public.credit_transactions(user_id, created_at DESC);
CREATE UNIQUE INDEX credit_transactions_reference_unique ON public.credit_transactions(reference_id) WHERE reference_id IS NOT NULL;

CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extension_id UUID NOT NULL REFERENCES public.extensions(id) ON DELETE CASCADE,
  license_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, extension_id)
);
GRANT SELECT ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own licenses" ON public.licenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX licenses_user_idx ON public.licenses(user_id);
CREATE INDEX licenses_extension_idx ON public.licenses(extension_id);

CREATE TABLE public.github_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT NOT NULL,
  github_username TEXT NOT NULL,
  repo_selected TEXT CHECK (repo_selected IS NULL OR repo_selected ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.github_connections TO service_role;
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  credits INTEGER NOT NULL CHECK (credits > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX payments_user_created_idx ON public.payments(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER extensions_updated_at BEFORE UPDATE ON public.extensions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER credit_transactions_updated_at BEFORE UPDATE ON public.credit_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER github_connections_updated_at BEFORE UPDATE ON public.github_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

CREATE POLICY "Owners can manage extensions" ON public.extensions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.provision_current_user()
RETURNS TABLE(balance INTEGER, role public.app_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_role public.app_role;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  v_role := CASE WHEN v_email = 'paulomanus304@gmail.com' THEN 'owner'::public.app_role ELSE 'user'::public.app_role END;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_user_id, v_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role WHERE public.user_roles.role <> 'owner';
  INSERT INTO public.user_credits(user_id, balance) VALUES (v_user_id, 20)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_transactions(user_id, amount, type, description, reference_id)
  VALUES (v_user_id, 20, 'welcome', 'Créditos de boas-vindas', 'welcome:' || v_user_id::text)
  ON CONFLICT (reference_id) WHERE reference_id IS NOT NULL DO NOTHING;
  RETURN QUERY SELECT c.balance, r.role FROM public.user_credits c JOIN public.user_roles r USING (user_id) WHERE c.user_id = v_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.provision_current_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_amount <= 0 OR p_amount > 10000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF char_length(p_description) NOT BETWEEN 2 AND 300 THEN RAISE EXCEPTION 'invalid_description'; END IF;
  IF public.has_role(p_user_id, 'owner') THEN
    INSERT INTO public.credit_transactions(user_id, amount, type, description)
    VALUES (p_user_id, 0, 'owner_bypass', p_description);
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
GRANT EXECUTE ON FUNCTION public.consume_credits(UUID, INTEGER, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.install_extension(p_extension_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID := auth.uid(); v_ok BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.licenses WHERE user_id = v_user_id AND extension_id = p_extension_id AND status = 'active') THEN RETURN true; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.extensions WHERE id = p_extension_id AND is_published) THEN RAISE EXCEPTION 'extension_not_found'; END IF;
  v_ok := public.consume_credits(v_user_id, 10, 'Instalação de extensão');
  IF NOT v_ok THEN RETURN false; END IF;
  INSERT INTO public.licenses(user_id, extension_id) VALUES (v_user_id, p_extension_id)
  ON CONFLICT (user_id, extension_id) DO UPDATE SET status = 'active', updated_at = now();
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.install_extension(UUID) TO authenticated;

INSERT INTO public.extensions(name, slug, description, price, billing_period, icon_url, category)
VALUES
('Painel LED 3x2', 'painel-led-3x2', 'Adicione um painel visual LED 3x2 personalizável ao seu projeto Lovable.', 4700, 'one_time', NULL, 'interface'),
('Color Changer Pro', 'color-changer-pro', 'Transforme o sistema de cores do seu projeto com paletas profissionais.', 2900, 'monthly', NULL, 'design'),
('SEO Booster', 'seo-booster', 'Otimize metadados, estrutura e descoberta do seu projeto nos buscadores.', 1900, 'monthly', NULL, 'marketing');

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;