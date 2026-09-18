CREATE TYPE public.departamento_enum AS ENUM ('ADMIN', 'FINANCEIRO', 'VENDAS', 'ESTOQUE', 'JURIDICO');

CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY,
  nome varchar(150) NOT NULL CHECK (char_length(trim(nome)) BETWEEN 2 AND 150),
  email varchar(150) NOT NULL UNIQUE CHECK (email = lower(email)),
  departamento public.departamento_enum NOT NULL DEFAULT 'VENDAS',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.usuarios FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Owners can view all users" ON public.usuarios FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can create users" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can update users" ON public.usuarios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can delete users" ON public.usuarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.convites_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(150) NOT NULL CHECK (email = lower(email)),
  departamento public.departamento_enum NOT NULL,
  token_hash varchar(64) NOT NULL UNIQUE,
  expira_em timestamptz NOT NULL,
  usado boolean NOT NULL DEFAULT false,
  usado_em timestamptz,
  cancelado_em timestamptz,
  criado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX convites_usuario_email_idx ON public.convites_usuario (email);
CREATE INDEX convites_usuario_status_idx ON public.convites_usuario (usado, expira_em);
CREATE INDEX convites_usuario_criado_por_idx ON public.convites_usuario (criado_por);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites_usuario TO authenticated;
GRANT ALL ON public.convites_usuario TO service_role;
ALTER TABLE public.convites_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view invitations" ON public.convites_usuario FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can create invitations" ON public.convites_usuario FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner') AND criado_por = auth.uid());
CREATE POLICY "Owners can update invitations" ON public.convites_usuario FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can delete invitations" ON public.convites_usuario FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.set_admin_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();

CREATE TRIGGER convites_usuario_updated_at
BEFORE UPDATE ON public.convites_usuario
FOR EACH ROW EXECUTE FUNCTION public.set_admin_updated_at();