-- ============================================================================
-- PHASE 1: CREATE RELATIONAL PASSENGERS TABLE
-- ============================================================================
-- This migration moves from unsafe JSON passenger storage to a proper
-- relational structure with UUIDs, foreign keys, and RLS security.
-- 
-- CRITICAL: Run this BEFORE updating application code
-- ============================================================================

-- 1. ADD UUID COLUMN TO FLIGHTS (for public API use)
-- Keep existing 'id' for internal use, add 'uuid' for external references
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- Populate UUIDs for existing flights
UPDATE public.flights SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Make UUID unique and indexed
ALTER TABLE public.flights ADD CONSTRAINT flights_uuid_unique UNIQUE (uuid);
CREATE INDEX IF NOT EXISTS idx_flights_uuid ON public.flights(uuid);

-- Add created_by column to flights if it doesn't exist (for ownership tracking)
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- 2. CREATE PASSENGERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    flight_id UUID NOT NULL REFERENCES public.flights(uuid) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Passenger data
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Adult', 'Child')) DEFAULT 'Adult',
    gender TEXT CHECK (gender IN ('M', 'F')),
    phone_number TEXT,
    agency TEXT,
    
    -- Keep minimal JSON for infant names only (array of strings)
    infants JSONB DEFAULT '[]'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_passengers_flight_id ON public.passengers(flight_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON public.passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_passengers_created_by ON public.passengers(created_by);

-- ============================================================================
-- 3. ADD AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================
CREATE TRIGGER update_passengers_updated_at
    BEFORE UPDATE ON public.passengers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own passengers" ON public.passengers;
DROP POLICY IF EXISTS "Users can insert passengers" ON public.passengers;
DROP POLICY IF EXISTS "Users can update passengers" ON public.passengers;
DROP POLICY IF EXISTS "Users can delete passengers" ON public.passengers;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR PASSENGERS
-- ============================================================================

-- SELECT: Users can view passengers from flights they own or their admin owns
CREATE POLICY "Users can view own passengers" ON public.passengers
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- INSERT: Users can add passengers to flights they have access to
CREATE POLICY "Users can insert passengers" ON public.passengers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- UPDATE: Users can update passengers they created or have permission for
CREATE POLICY "Users can update passengers" ON public.passengers
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        user_id = auth.uid()
        OR
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        created_by = auth.uid()
        OR
        user_id = auth.uid()
        OR
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- DELETE: Users can delete passengers they created or have permission for
CREATE POLICY "Users can delete passengers" ON public.passengers
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        user_id = auth.uid()
        OR
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- 6. MIGRATE EXISTING DATA FROM JSON TO RELATIONAL
-- ============================================================================
-- This moves all passengers from the JSONB array into individual rows

INSERT INTO public.passengers (
    flight_id, 
    user_id, 
    name, 
    type, 
    gender, 
    phone_number, 
    agency, 
    infants,
    created_by,
    created_at
)
SELECT 
    f.uuid as flight_id,
    f.user_id,
    p->>'name' as name,
    COALESCE(p->>'type', 'Adult') as type,
    p->>'gender' as gender,
    p->>'phoneNumber' as phone_number,
    p->>'agency' as agency,
    COALESCE(p->'infants', '[]'::jsonb) as infants,
    f.created_by,
    f.created_at
FROM public.flights f
CROSS JOIN LATERAL jsonb_array_elements(f.passengers) AS p
WHERE f.passengers IS NOT NULL 
    AND jsonb_array_length(f.passengers) > 0
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify migration succeeded

-- Count passengers in old JSON format
-- SELECT 
--     COUNT(*) as total_flights,
--     SUM(jsonb_array_length(COALESCE(passengers, '[]'::jsonb))) as total_json_passengers
-- FROM public.flights;

-- Count passengers in new table
-- SELECT COUNT(*) as total_relational_passengers FROM public.passengers;

-- Compare counts (should match)
-- SELECT 
--     (SELECT SUM(jsonb_array_length(COALESCE(passengers, '[]'::jsonb))) FROM public.flights) as json_count,
--     (SELECT COUNT(*) FROM public.passengers) as relational_count;

-- ============================================================================
-- 8. NEXT STEPS (DO NOT RUN YET - FOR REFERENCE ONLY)
-- ============================================================================
-- After verifying the application works with the new structure:
-- 
-- ALTER TABLE public.flights DROP COLUMN passengers;
-- 
-- This will permanently remove the old JSON column.
-- Only do this after thorough testing!
-- ============================================================================

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
