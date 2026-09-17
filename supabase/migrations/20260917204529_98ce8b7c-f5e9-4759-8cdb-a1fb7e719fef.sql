CREATE OR REPLACE FUNCTION private.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF p_amount <= 0 OR p_amount > 10000 OR char_length(p_description) NOT BETWEEN 2 AND 300 THEN
    RAISE EXCEPTION 'invalid_refund';
  END IF;
  IF private.has_role(p_user_id, 'owner') THEN RETURN true; END IF;
  UPDATE public.user_credits SET balance = balance + p_amount, updated_at = now() WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.credit_transactions(user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', p_description);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text
) RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$ SELECT private.refund_credits(p_user_id, p_amount, p_description) $$;

REVOKE ALL ON FUNCTION public.refund_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, integer, text) TO service_role;