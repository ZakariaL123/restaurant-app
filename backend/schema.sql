CREATE TABLE IF NOT EXISTS public.menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  is_available boolean NOT NULL DEFAULT true
);
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS image_url text;