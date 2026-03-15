CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'golomt',
  transaction_id UUID NOT NULL,
  invoice_id TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redirected', 'paid', 'failed', 'cancelled')),
  redirect_url TEXT,
  callback_signature TEXT,
  provider_reference TEXT,
  verification_error TEXT,
  raw_request JSONB,
  raw_callback JSONB,
  last_verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_provider_transaction
  ON public.payment_attempts(provider, transaction_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_provider_invoice
  ON public.payment_attempts(provider, invoice_id)
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_attempts_group_id
  ON public.payment_attempts(group_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_status
  ON public.payment_attempts(status, created_at DESC);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view payment attempts" ON public.payment_attempts;
CREATE POLICY "Admins can view payment attempts"
ON public.payment_attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'liaison')
  )
);

GRANT ALL ON public.payment_attempts TO service_role;
GRANT SELECT ON public.payment_attempts TO authenticated;
