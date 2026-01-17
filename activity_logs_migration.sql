
-- ============================================================================
-- ACTIVITY LOGS TABLE MIGRATION
-- ============================================================================
-- This table tracks user actions for audit purposes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who did it
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- What happened
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('FLIGHT', 'PASSENGER', 'AGENCY', 'AIRLINE', 'PRICE')),
    entity_id TEXT, -- Can be UUID or string ID
    
    -- Details
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb, -- Stores { before: {...}, after: {...} }
    
    -- When
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- For RLS ownership propagation (matches flights/passengers pattern)
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance (filtering by date and user)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_by ON public.activity_logs(created_by);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_logs;

-- SELECT: Users can view logs they created or belong to their agency context
CREATE POLICY "Users can view own logs" ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        created_by = auth.uid()
        OR
        created_by = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- INSERT: Users can insert logs
CREATE POLICY "Users can insert own logs" ON public.activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
