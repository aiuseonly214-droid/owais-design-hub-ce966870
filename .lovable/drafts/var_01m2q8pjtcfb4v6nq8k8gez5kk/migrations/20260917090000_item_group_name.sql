-- Optional section/group name for line items. NULL = ungrouped (existing behaviour).
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS group_name text;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS group_name text;
