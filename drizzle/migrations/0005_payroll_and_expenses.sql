CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text,
  phone text,
  joining_date date,
  monthly_salary numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all staff" ON public.staff_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  period text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  mode text NOT NULL DEFAULT 'bank',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_payments TO authenticated;
GRANT ALL ON public.salary_payments TO service_role;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all salary" ON public.salary_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'cash',
  reference text,
  notes text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all expenses" ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));