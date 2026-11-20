DO $orders_schema$
BEGIN
  CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    total_minor integer NOT NULL CHECK (total_minor >= 0)
  );

  ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'working', 'done'));

  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id text;

  CREATE INDEX IF NOT EXISTS orders_customer_recent_idx
    ON public.orders (customer_id, created_at DESC, id DESC) WHERE customer_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS orders_status_recent_idx
    ON public.orders (status, created_at DESC, id DESC);

  CREATE TABLE IF NOT EXISTS public.order_items (
    order_id uuid NOT NULL REFERENCES public.orders(id),
    menu_item_id text NOT NULL REFERENCES public.menu_items(id),
    item_name text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price_minor integer NOT NULL CHECK (unit_price_minor >= 0),
    PRIMARY KEY (order_id, menu_item_id)
  );
END;
$orders_schema$;
