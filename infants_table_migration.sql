-- ============================================================================
-- INFANTS TABLE MIGRATION
-- ============================================================================
-- This migration moves infant storage from JSONB arrays in passengers table
-- to a proper relational structure.
-- 
-- CRITICAL: Run this AFTER relational_passengers_migration.sql
-- ============================================================================

-- ============================================================================
-- 1. CREATE INFANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.infants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Infant data
    name TEXT NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_infants_passenger_id ON public.infants(passenger_id);
CREATE INDEX IF NOT EXISTS idx_infants_user_id ON public.infants(user_id);
CREATE INDEX IF NOT EXISTS idx_infants_created_by ON public.infants(created_by);

-- ============================================================================
-- 2. ADD AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================
CREATE TRIGGER update_infants_updated_at
    BEFORE UPDATE ON public.infants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.infants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own infants" ON public.infants;
DROP POLICY IF EXISTS "Users can insert infants" ON public.infants;
DROP POLICY IF EXISTS "Users can update infants" ON public.infants;
DROP POLICY IF EXISTS "Users can delete infants" ON public.infants;

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR INFANTS
-- ============================================================================

-- SELECT: Users can view infants belonging to their passengers
CREATE POLICY "Users can view own infants" ON public.infants
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- INSERT: Users can add infants to their passengers
CREATE POLICY "Users can insert infants" ON public.infants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- UPDATE: Users can update infants they created
CREATE POLICY "Users can update infants" ON public.infants
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

-- DELETE: Users can delete infants they created
CREATE POLICY "Users can delete infants" ON public.infants
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
-- 5. MIGRATE EXISTING DATA FROM JSONB TO RELATIONAL
-- ============================================================================
-- Extract infant names from JSONB arrays and create individual rows

INSERT INTO public.infants (
    passenger_id,
    user_id,
    name,
    created_by,
    created_at
)
SELECT 
    p.id as passenger_id,
    p.user_id,
    infant_name.value::text as name,
    p.created_by,
    p.created_at
FROM public.passengers p
CROSS JOIN LATERAL jsonb_array_elements_text(p.infants) AS infant_name(value)
WHERE p.infants IS NOT NULL 
    AND jsonb_array_length(p.infants) > 0
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify migration succeeded

-- Count infants in old JSONB format
-- SELECT 
--     COUNT(*) as passengers_with_infants,
--     SUM(jsonb_array_length(COALESCE(infants, '[]'::jsonb))) as total_jsonb_infants
-- FROM public.passengers
-- WHERE infants IS NOT NULL AND jsonb_array_length(infants) > 0;

-- Count infants in new table
-- SELECT COUNT(*) as total_relational_infants FROM public.infants;

-- Compare counts (should match)
-- SELECT 
--     (SELECT SUM(jsonb_array_length(COALESCE(infants, '[]'::jsonb))) 
--      FROM public.passengers 
--      WHERE infants IS NOT NULL) as jsonb_count,
--     (SELECT COUNT(*) FROM public.infants) as relational_count;

-- ============================================================================
-- 7. NEXT STEPS (DO NOT RUN YET - FOR REFERENCE ONLY)
-- ============================================================================
-- After verifying the application works with the new structure:
-- 
-- ALTER TABLE public.passengers DROP COLUMN infants;
-- 
-- This will permanently remove the old JSONB column.
-- Only do this after thorough testing!
-- ============================================================================

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
