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
