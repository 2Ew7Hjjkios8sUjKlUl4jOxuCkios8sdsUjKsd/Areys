-- Migration: Create Role Permissions System
-- Run this in Supabase SQL Editor

-- 1. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- First, drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Everyone can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can insert role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can update role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can delete role permissions" ON role_permissions;

-- Everyone can view permissions
CREATE POLICY "Everyone can view role permissions"
    ON role_permissions FOR SELECT
    USING (true);

-- Only Admins can modify permissions
CREATE POLICY "Admins can insert role permissions"
    ON role_permissions FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update role permissions"
    ON role_permissions FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete role permissions"
    ON role_permissions FOR DELETE
    USING (public.is_admin());

-- 4. Seed Default Permissions Function
CREATE OR REPLACE FUNCTION seed_permissions() RETURNS void AS $$
BEGIN
    -- Admin: Full Access
    INSERT INTO role_permissions (role, permissions) VALUES
    ('Admin', '{
        "flight": {"create": true, "delete": true, "delete_own": true},
        "passenger": {"create": true, "delete": true, "delete_own": true},
        "generating": {"batch": true, "manifest": true, "ticket": true, "download": true},
        "searching": {"past": true, "upcoming": true},
        "settings": {
            "airline_create": true, "airline_update": true, "airline_delete": true,
            "pricing_edit": true,
            "agency_create": true, "agency_update": true, "agency_delete": true,
            "user_create": true, "user_activate": true, "user_deactivate": true
        }
    }'::jsonb)
    ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

    -- Manager: Limited Settings, Full Operations
    INSERT INTO role_permissions (role, permissions) VALUES
    ('Manager', '{
        "flight": {"create": true, "delete": false, "delete_own": true},
        "passenger": {"create": true, "delete": false, "delete_own": true},
        "generating": {"batch": true, "manifest": true, "ticket": true, "download": true},
        "searching": {"past": true, "upcoming": true},
        "settings": {
            "airline_create": false, "airline_update": false, "airline_delete": false,
            "pricing_edit": false,
            "agency_create": true, "agency_update": true, "agency_delete": false,
            "user_create": true, "user_activate": false, "user_deactivate": false
        }
    }'::jsonb)
    ON CONFLICT (role) DO NOTHING;

    -- Staff: Basic Operations Only
    INSERT INTO role_permissions (role, permissions) VALUES
    ('Staff', '{
        "flight": {"create": false, "delete": false, "delete_own": false},
        "passenger": {"create": true, "delete": false, "delete_own": true},
        "generating": {"batch": false, "manifest": false, "ticket": true, "download": true},
        "searching": {"past": false, "upcoming": true},
        "settings": {
            "airline_create": false, "airline_update": false, "airline_delete": false,
            "pricing_edit": false,
            "agency_create": false, "agency_update": false, "agency_delete": false,
            "user_create": false, "user_activate": false, "user_deactivate": false
        }
    }'::jsonb)
    ON CONFLICT (role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute Seed
SELECT seed_permissions();

-- Cleanup
DROP FUNCTION seed_permissions();
