-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view crises" ON crises;
DROP POLICY IF EXISTS "Staff can update crises" ON crises;

-- Create a SECURITY DEFINER function to bypass RLS when checking roles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role_enum
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Recreate policies using the new function
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT
  USING (public.get_my_role() IN ('staff', 'admin'));

CREATE POLICY "Staff can view crises" ON crises FOR SELECT
  USING (public.get_my_role() IN ('staff', 'admin'));

CREATE POLICY "Staff can update crises" ON crises FOR UPDATE
  USING (public.get_my_role() IN ('staff', 'admin'));
