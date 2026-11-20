CREATE TABLE IF NOT EXISTS public.restaurant_staff (
  email text PRIMARY KEY,
  user_id text UNIQUE,
  invite_digest text UNIQUE,
  expires_at timestamptz,
  CHECK (
    (user_id IS NULL AND invite_digest IS NOT NULL AND expires_at IS NOT NULL)
    OR (user_id IS NOT NULL AND invite_digest IS NULL AND expires_at IS NULL)
  )
);
