ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS include_in_total boolean NOT NULL DEFAULT true;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS include_in_total boolean NOT NULL DEFAULT true;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS show_totals boolean NOT NULL DEFAULT true;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS show_totals boolean NOT NULL DEFAULT true;