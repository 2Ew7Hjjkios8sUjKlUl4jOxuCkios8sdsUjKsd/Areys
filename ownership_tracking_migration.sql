-- Migration: Add Ownership Tracking
-- Run this in Supabase SQL Editor

-- Add created_by column to flights
ALTER TABLE flights ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing flights to be owned by the Admin (user_id)
UPDATE flights SET created_by = user_id WHERE created_by IS NULL;

-- Ensure RLS allows selecting this column
-- (Existing policies usually allow SELECT * so we should be fine)
