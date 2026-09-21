ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS show_section_subtotals boolean NOT NULL DEFAULT true;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS show_section_subtotals boolean NOT NULL DEFAULT true;