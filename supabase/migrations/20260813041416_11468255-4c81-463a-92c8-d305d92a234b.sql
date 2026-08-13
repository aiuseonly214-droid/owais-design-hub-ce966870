CREATE SEQUENCE IF NOT EXISTS public.inquiry_seq START 1;

CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT public.next_code('INQ', 'public.inquiry_seq', false),
  name text NOT NULL,
  mobile text NOT NULL,
  city text,
  source text NOT NULL DEFAULT 'walk_in',
  service text,
  requirement text,
  budget numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  follow_up_date date,
  notes text,
  customer_id uuid REFERENCES public.customers(id),
  quotation_id uuid REFERENCES public.quotations(id),
  converted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
GRANT USAGE ON SEQUENCE public.inquiry_seq TO authenticated, service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert inquiries" ON public.inquiries FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "staff update inquiries" ON public.inquiries FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER inquiries_updated BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();