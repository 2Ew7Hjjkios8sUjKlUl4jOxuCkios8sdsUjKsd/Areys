-- ROUND 11: SETTINGS AUDIT TRACKING
-- Adds updated_at and updated_by to key settings tables

-- 1. Update Airlines
ALTER TABLE public.airlines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.airlines ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. Update Agencies
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 3. Update Settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 4. Triggers for auto-updating updated_at
-- Note: update_updated_at_column() must already exist (from initial migration)
DROP TRIGGER IF EXISTS update_airlines_updated_at ON public.airlines;
CREATE TRIGGER update_airlines_updated_at
    BEFORE UPDATE ON public.airlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agencies_updated_at ON public.agencies;
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON public.agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update current entries to show Admin as initial updated_by if null (optional but helpful)
-- UPDATE public.airlines SET updated_by = user_id WHERE updated_by IS NULL;
-- UPDATE public.agencies SET updated_by = user_id WHERE updated_by IS NULL;
-- UPDATE public.settings SET updated_by = user_id WHERE updated_by IS NULL;
