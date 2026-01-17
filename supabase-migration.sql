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

-- Function to auto-create user role when email is confirmed (if not exists)
-- This handles the case where registration happens but user_roles entry doesn't exist yet
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user_role if email is confirmed and role doesn't exist
    IF NEW.email_confirmed_at IS NOT NULL AND 
       NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO user_roles (user_id, email, role, created_by)
        VALUES (NEW.id, NEW.email, 'admin', NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create user_roles entry when email is confirmed
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
    EXECUTE FUNCTION handle_new_user();

-- Also handle case where user signs up with email already confirmed (if email confirmation is disabled)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION handle_new_user();

-- 7. Add Pricing Columns to Airlines Table (Per-Airline Pricing)
ALTER TABLE airlines
ADD COLUMN IF NOT EXISTS adult_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS child_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS infant_price NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge NUMERIC(10, 2) DEFAULT 0;
