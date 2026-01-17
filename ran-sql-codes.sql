-- Supabase Migration Script for Ticket Printer App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Manager', 'Staff')),
    active BOOLEAN DEFAULT true,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Flights Table
CREATE TABLE IF NOT EXISTS flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    airline TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    date DATE NOT NULL,
    route TEXT NOT NULL,
    passengers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Airlines Table
CREATE TABLE IF NOT EXISTS airlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticket_template TEXT NOT NULL,
    manifest_template TEXT NOT NULL,
    manifest_us TEXT NOT NULL,
    manifest_airport TEXT NOT NULL,
    default_booking_reference TEXT,
    default_flight_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    manager_phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    adult_price NUMERIC(10, 2) DEFAULT 130,
    child_price NUMERIC(10, 2) DEFAULT 90,
    infant_price NUMERIC(10, 2) DEFAULT 20,
    tax NUMERIC(10, 2) DEFAULT 10,
    surcharge NUMERIC(10, 2) DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Managed Users Table
CREATE TABLE IF NOT EXISTS managed_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    managed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Staff')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flights_user_id ON flights(user_id);
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(date);
CREATE INDEX IF NOT EXISTS idx_airlines_user_id ON airlines(user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_managed_users_user_id ON managed_users(user_id);
CREATE INDEX IF NOT EXISTS idx_managed_users_managed_user_id ON managed_users(managed_user_id);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
-- Users can read their own role
CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can read all roles (for admin functions)
CREATE POLICY "Users can view all roles"
    ON user_roles FOR SELECT
    USING (true);

-- Users can insert their own role (on registration)
CREATE POLICY "Users can insert their own role"
    ON user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON user_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

-- RLS Policies for flights
CREATE POLICY "Users can view their own flights"
    ON flights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flights"
    ON flights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flights"
    ON flights FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flights"
    ON flights FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for airlines
CREATE POLICY "Users can view their own airlines"
    ON airlines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own airlines"
    ON airlines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own airlines"
    ON airlines FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own airlines"
    ON airlines FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for agencies
CREATE POLICY "Users can view their own agencies"
    ON agencies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agencies"
    ON agencies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agencies"
    ON agencies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agencies"
    ON agencies FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for settings
CREATE POLICY "Users can view their own settings"
    ON settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON settings FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for managed_users
CREATE POLICY "Users can view their managed users"
    ON managed_users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert managed users"
    ON managed_users FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their managed users"
    ON managed_users FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their managed users"
    ON managed_users FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flights table
CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for settings table
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE airlines
ADD COLUMN IF NOT EXISTS adult_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS child_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS infant_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge NUMERIC(10, 2) DEFAULT 0;





-- Update RLS Policies to allow Staff access to Admin data
-- Run this in Supabase SQL Editor

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own flights" ON flights;
DROP POLICY IF EXISTS "Users can view their own airlines" ON airlines;
DROP POLICY IF EXISTS "Users can view their own agencies" ON agencies;
DROP POLICY IF EXISTS "Users can view their own settings" ON settings;

-- 2. Create new specific policies for FLIGHTS
CREATE POLICY "Users can view own or managed flights" ON flights
FOR SELECT USING (
    auth.uid() = user_id -- Owner
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = flights.user_id AND managed_user_id = auth.uid()) -- Staff
);

CREATE POLICY "Users can insert own or managed flights" ON flights
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = flights.user_id AND managed_user_id = auth.uid())
);

CREATE POLICY "Users can update own or managed flights" ON flights
FOR UPDATE USING (
    auth.uid() = user_id
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = flights.user_id AND managed_user_id = auth.uid())
);

-- 3. Create new specific policies for AIRLINES
CREATE POLICY "Users can view own or managed airlines" ON airlines
FOR SELECT USING (
    auth.uid() = user_id
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = airlines.user_id AND managed_user_id = auth.uid())
);

-- 4. Create new specific policies for AGENCIES
CREATE POLICY "Users can view own or managed agencies" ON agencies
FOR SELECT USING (
    auth.uid() = user_id
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = agencies.user_id AND managed_user_id = auth.uid())
);

-- 5. Create new specific policies for SETTINGS
CREATE POLICY "Users can view own or managed settings" ON settings
FOR SELECT USING (
    auth.uid() = user_id
    OR 
    EXISTS (SELECT 1 FROM managed_users WHERE user_id = settings.user_id AND managed_user_id = auth.uid())
);

-- Note: We generally don't want Staff deleting core configuration, so we leave DELETE policies as Owner-only for now, 
-- or you can update them similarly if needed.



--------

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




-------------

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


---------

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



-------------------
