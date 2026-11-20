CREATE TABLE IF NOT EXISTS public.dish_photos (
  filename text PRIMARY KEY,
  image bytea NOT NULL CHECK (octet_length(image) BETWEEN 5 AND 5242880)
);
