-- 1. ADD COLUMN TO FLIGHTS & REFRESH CACHE
-- This block ensures the column exists and forces Supabase to see it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flights' AND column_name='created_by') THEN
        ALTER TABLE public.flights ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Force a schema cache refresh (PostgREST)
NOTIFY pgrst, 'reload schema';

-- 2. ENSURE USER_ROLES IS READABLE (Crucial for subqueries in other policies)
-- Without this, staff can't verify who their admin is
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
CREATE POLICY "Anyone can read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- 3. CUSTOM FUNCTION FOR ROLE PERMISSIONS (High Security)
CREATE OR REPLACE FUNCTION public.has_role_permission(p_category text, p_action text)
RETURNS boolean AS $$
DECLARE
    v_role text;
    v_perms jsonb;
BEGIN
    -- Get current user's role
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = auth.uid();
    
    -- Admin always has permission
    IF v_role = 'Admin' THEN
        RETURN true;
    END IF;
    
    -- Get permissions for that role
    SELECT permissions INTO v_perms FROM public.role_permissions WHERE role = v_role;
    
    -- Check if permission exists and is true
    RETURN COALESCE((v_perms->p_category->>p_action)::boolean, false);
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APPLY SHARED BUT RESTRICTED POLICIES

-- FLIGHTS
DROP POLICY IF EXISTS "Strict shared access for flights" ON public.flights;
DROP POLICY IF EXISTS "Shared access for flights" ON public.flights;
CREATE POLICY "High security access for flights" ON public.flights
    FOR ALL
    TO authenticated
    USING (
        -- Admin owns the data group
        (user_id = auth.uid()) 
        OR 
        (
            -- Staff belongs to this admin
            user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
            AND 
            (
                public.has_role_permission('flight', 'view_any') 
                OR 
                (public.has_role_permission('flight', 'view_own') AND created_by = auth.uid())
            )
        )
    )
    WITH CHECK (
        -- Can only insert if you belong to this admin and have create permission
        (user_id = auth.uid())
        OR 
        (
            user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
            AND public.has_role_permission('flight', 'create')
        )
    );

-- AIRLINES
DROP POLICY IF EXISTS "Shared access for airlines" ON public.airlines;
CREATE POLICY "High security access for airlines" ON public.airlines
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        (
            user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
            AND public.has_role_permission('settings', 'airline_create')
        )
    );

-- AGENCIES
DROP POLICY IF EXISTS "Shared access for agencies" ON public.agencies;
CREATE POLICY "High security access for agencies" ON public.agencies
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        (
            user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
            AND public.has_role_permission('settings', 'agency_create')
        )
    );

-- SETTINGS (Pricing)
DROP POLICY IF EXISTS "Shared access for settings" ON public.settings;
CREATE POLICY "High security access for settings" ON public.settings
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        (
            user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
            AND public.has_role_permission('settings', 'pricing_edit')
        )
    );

-- 5. FINAL REFRESH
NOTIFY pgrst, 'reload schema';
