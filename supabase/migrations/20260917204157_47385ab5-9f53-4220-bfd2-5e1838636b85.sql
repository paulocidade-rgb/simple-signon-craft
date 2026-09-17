ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';
ALTER TABLE public.payments ADD CONSTRAINT payments_environment_check CHECK (environment IN ('sandbox', 'live'));
CREATE INDEX IF NOT EXISTS payments_environment_idx ON public.payments(environment);

CREATE OR REPLACE FUNCTION private.fulfill_credit_purchase(
  p_user_id uuid,
  p_stripe_session_id text,
  p_amount_cents integer,
  p_credits integer,
  p_environment text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE inserted_id uuid;
BEGIN
  IF p_credits <= 0 OR p_amount_cents < 0 OR p_environment NOT IN ('sandbox', 'live') THEN
    RAISE EXCEPTION 'Invalid payment data';
  END IF;

  INSERT INTO public.payments(user_id, stripe_session_id, amount_cents, credits, status, environment)
  VALUES (p_user_id, p_stripe_session_id, p_amount_cents, p_credits, 'paid', p_environment)
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO inserted_id;

  IF inserted_id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.user_credits(user_id, balance)
  VALUES (p_user_id, 20 + p_credits)
  ON CONFLICT (user_id) DO UPDATE SET balance = public.user_credits.balance + p_credits, updated_at = now();

  INSERT INTO public.credit_transactions(user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_credits, 'purchase', 'Compra de créditos', p_stripe_session_id);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.fulfill_credit_purchase(
  p_user_id uuid,
  p_stripe_session_id text,
  p_amount_cents integer,
  p_credits integer,
  p_environment text
) RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$ SELECT private.fulfill_credit_purchase(p_user_id, p_stripe_session_id, p_amount_cents, p_credits, p_environment) $$;

REVOKE ALL ON FUNCTION public.fulfill_credit_purchase(uuid, text, integer, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_credit_purchase(uuid, text, integer, integer, text) TO service_role;