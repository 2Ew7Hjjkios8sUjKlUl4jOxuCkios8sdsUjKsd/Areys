-- FIX INFINITE RECURSION IN RLS
-- Run this in Supabase SQL Editor

-- 1. Create a secure function to check Admin status
-- SECURITY DEFINER means this function runs with higher privileges, 
-- bypassing the RLS on user_roles (preventing the loop)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND (role = 'Admin' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up old, recursive policies
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;

-- 3. Create Clean, Non-Recursive Policies using the new function

-- SELECT: Admins see all, Users see themselves
CREATE POLICY "Allow View Roles"
ON user_roles FOR SELECT
USING (
    auth.uid() = user_id
    OR
    is_admin()
);

-- INSERT: Admins can create for anyone, Users can create for themselves (signup)
CREATE POLICY "Allow Insert Roles"
ON user_roles FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    OR
    is_admin()
);

-- UPDATE: Only Admins can update roles
CREATE POLICY "Allow Update Roles"
ON user_roles FOR UPDATE
USING ( is_admin() );

-- DELETE: Only Admins can delete roles
CREATE POLICY "Allow Delete Roles"
ON user_roles FOR DELETE
USING ( is_admin() );
