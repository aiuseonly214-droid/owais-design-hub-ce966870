CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles WHERE role = 'admin') = 0 THEN 'admin'::public.app_role ELSE 'employee'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Owais Interior Designer',
  tagline text NOT NULL DEFAULT 'Turning your space into elegant design',
  address text NOT NULL DEFAULT 'Rahmat Nagar, Wadala, Nashik, Maharashtra',
  mobile1 text NOT NULL DEFAULT '7756043214',
  mobile2 text DEFAULT '7721926290',
  email text NOT NULL DEFAULT 'onlyw6469@gmail.com',
  website text,
  logo_url text,
  stamp_url text,
  signature_url text,
  currency text NOT NULL DEFAULT 'INR',
  default_terms text NOT NULL DEFAULT '1. 50% advance payment required to start the work.
2. Balance payment due on completion of work.
3. Quotation valid for 15 days from the date of issue.
4. Any additional work will be charged extra.
5. Material rates are subject to change without prior notice.',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all read company" ON public.company_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin update company" ON public.company_profile FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert company" ON public.company_profile FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER company_updated BEFORE UPDATE ON public.company_profile FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.company_profile (id) VALUES ('00000000-0000-0000-0000-000000000001');

CREATE SEQUENCE public.customer_seq START 1;
CREATE SEQUENCE public.quotation_seq START 1;
CREATE SEQUENCE public.invoice_seq START 1;
CREATE SEQUENCE public.receipt_seq START 1;

CREATE OR REPLACE FUNCTION public.next_code(_prefix text, _seq text, _with_year boolean)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n bigint;
BEGIN
  n := nextval(_seq);
  IF _with_year THEN
    RETURN _prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN _prefix || '-' || lpad(n::text, 4, '0');
END; $$;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('CUS', 'public.customer_seq', false),
  name text NOT NULL,
  mobile text NOT NULL,
  alt_mobile text,
  email text,
  site_address text,
  billing_address text,
  city text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete customers" ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('QT', 'public.quotation_seq', true),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT current_date,
  valid_till date,
  subject text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0,
  amount_words text,
  terms text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update quotations" ON public.quotations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete quotations" ON public.quotations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER quotations_updated BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  sr integer NOT NULL DEFAULT 1,
  particular text NOT NULL DEFAULT '',
  description text,
  unit text,
  qty numeric(12,2) NOT NULL DEFAULT 1,
  rate numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage quotation items" ON public.quotation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('INV', 'public.invoice_seq', true),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  due_date date,
  subject text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0,
  amount_words text,
  terms text,
  status text NOT NULL DEFAULT 'unpaid',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  sr integer NOT NULL DEFAULT 1,
  particular text NOT NULL DEFAULT '',
  description text,
  unit text,
  qty numeric(12,2) NOT NULL DEFAULT 1,
  rate numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT public.next_code('RC', 'public.receipt_seq', true),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  previous_paid numeric(14,2) NOT NULL DEFAULT 0,
  amount_received numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'cash',
  txn_id text,
  amount_words text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read receipts" ON public.receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update receipts" ON public.receipts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete receipts" ON public.receipts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER receipts_updated BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();