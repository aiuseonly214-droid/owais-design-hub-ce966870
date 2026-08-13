
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  -- Only the very first account is bootstrapped as admin.
  -- All other accounts get NO role: an admin must grant access explicitly.
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $function$;

-- Admin-managed role assignment
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND user_id <> auth.uid());

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Profiles: allow a user to create only their own profile row
DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
GRANT INSERT ON public.profiles TO authenticated;
