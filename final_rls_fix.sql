-- 1. ADD COLUMN TO FLIGHTS IF NOT EXISTS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flights' AND column_name='created_by') THEN
        ALTER TABLE public.flights ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. UPDATE EXISTING DATA (Optional backup)
UPDATE public.flights SET created_by = user_id WHERE created_by IS NULL;

-- 3. DROP OLD POLICIES (So we can recreate them clearly)
DROP POLICY IF EXISTS "Users can view own flights" ON public.flights;
DROP POLICY IF EXISTS "Users can insert own flights" ON public.flights;
DROP POLICY IF EXISTS "Users can update own flights" ON public.flights;
DROP POLICY IF EXISTS "Users can delete own flights" ON public.flights;

DROP POLICY IF EXISTS "Users can view own airlines" ON public.airlines;
DROP POLICY IF EXISTS "Users can insert own airlines" ON public.airlines;
DROP POLICY IF EXISTS "Users can update own airlines" ON public.airlines;
DROP POLICY IF EXISTS "Users can delete own airlines" ON public.airlines;

DROP POLICY IF EXISTS "Users can view own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Users can insert own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Users can update own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Users can delete own agencies" ON public.agencies;

DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;

-- 4. CREATE NEW SHARED POLICIES

-- Helper to check if current user is the owner OR a managed user of the row's user_id
-- We use a function or a direct subquery. Subquery is often easier to copy-paste.

-- FLIGHTS
CREATE POLICY "Shared access for flights" ON public.flights
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- AIRLINES
CREATE POLICY "Shared access for airlines" ON public.airlines
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- AGENCIES
CREATE POLICY "Shared access for agencies" ON public.agencies
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- SETTINGS
CREATE POLICY "Shared access for settings" ON public.settings
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );

-- MANAGED USERS (The table itself might need shared access too if Staff manage other Staff)
DROP POLICY IF EXISTS "Users can view own managed users" ON public.managed_users;
CREATE POLICY "Shared access for managed_users" ON public.managed_users
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        user_id = (SELECT created_by FROM public.user_roles WHERE user_id = auth.uid())
    );
