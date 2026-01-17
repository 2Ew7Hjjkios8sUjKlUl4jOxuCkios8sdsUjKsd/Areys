-- COMPREHENSIVE FIX for User Creation & Permissions
-- Run this in Supabase SQL Editor

-- 1. Fix Inconsistent Data (Case Sensitivity)
-- Updates any lowercase 'admin' roles to Title Case 'Admin' to match the Check Constraint
UPDATE user_roles SET role = 'Admin' WHERE role = 'admin';

-- 2. Update the Trigger Function to use correct casing for future users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user_role if email is confirmed and role doesn't exist
    IF NEW.email_confirmed_at IS NOT NULL AND 
       NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO user_roles (user_id, email, role, created_by)
        VALUES (NEW.id, NEW.email, 'Admin', NEW.id) -- Fixed: 'Admin' instead of 'admin'
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policy to be Case-Insensitive and Robust
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;

CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (
    -- Allow if the current user is an Admin (checking both cases just to be safe)
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND (role = 'Admin' OR role = 'admin')
    )
);

-- 4. Ensure Admins can also SELECT all rows (needed to check for duplicates etc)
-- The existing policy "Users can view all roles" (if it exists) usually covers this, but let's be sure.
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND (role = 'Admin' OR role = 'admin')
    )
);
