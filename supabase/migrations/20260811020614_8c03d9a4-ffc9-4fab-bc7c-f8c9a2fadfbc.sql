-- Staff helper (admin or employee)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- CUSTOMERS
DROP POLICY IF EXISTS "read customers" ON public.customers;
DROP POLICY IF EXISTS "insert customers" ON public.customers;
DROP POLICY IF EXISTS "update customers" ON public.customers;
CREATE POLICY "staff read customers" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "staff update customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- QUOTATIONS
DROP POLICY IF EXISTS "read quotations" ON public.quotations;
DROP POLICY IF EXISTS "insert quotations" ON public.quotations;
DROP POLICY IF EXISTS "update quotations" ON public.quotations;
CREATE POLICY "staff read quotations" ON public.quotations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "staff update quotations" ON public.quotations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- INVOICES
DROP POLICY IF EXISTS "read invoices" ON public.invoices;
DROP POLICY IF EXISTS "insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "update invoices" ON public.invoices;
CREATE POLICY "staff read invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "staff update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- RECEIPTS
DROP POLICY IF EXISTS "read receipts" ON public.receipts;
DROP POLICY IF EXISTS "insert receipts" ON public.receipts;
DROP POLICY IF EXISTS "update receipts" ON public.receipts;
CREATE POLICY "staff read receipts" ON public.receipts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "staff update receipts" ON public.receipts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- QUOTATION ITEMS
DROP POLICY IF EXISTS "manage quotation items" ON public.quotation_items;
CREATE POLICY "staff manage quotation items" ON public.quotation_items FOR ALL TO authenticated
USING (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id))
WITH CHECK (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id));

-- INVOICE ITEMS
DROP POLICY IF EXISTS "manage invoice items" ON public.invoice_items;
CREATE POLICY "staff manage invoice items" ON public.invoice_items FOR ALL TO authenticated
USING (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id))
WITH CHECK (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id));

-- COMPANY PROFILE
DROP POLICY IF EXISTS "all read company" ON public.company_profile;
CREATE POLICY "staff read company" ON public.company_profile FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- PROFILES
DROP POLICY IF EXISTS "read profiles" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));