-- Fix RLS Policy for User Creation
-- Run this in Supabase SQL Editor

-- Allow Admins to insert into user_roles table (required when creating new users)
CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'Admin'
    )
);

-- Ensure Admins can also delete if needed (good practice for management)
CREATE POLICY "Admins can delete user roles"
ON user_roles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'Admin'
    )
);
