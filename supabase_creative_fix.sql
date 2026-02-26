-- Fix for Creative Assets Table and RLS
-- Run this in your Supabase SQL Editor

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    prompt_used TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Constraint (This fixes the 'agency'/'logo' save error)
ALTER TABLE public.creative_assets 
DROP CONSTRAINT IF EXISTS creative_assets_asset_type_check;

ALTER TABLE public.creative_assets 
ADD CONSTRAINT creative_assets_asset_type_check 
CHECK (asset_type IN ('image', 'video', 'logo', 'agency'));

-- 3. Enable RLS
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

-- 4. Update Function to Auto-Update Timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_trigger ON public.creative_assets;
CREATE TRIGGER update_timestamp_trigger BEFORE UPDATE ON public.creative_assets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 5. Re-apply Strict RLS Policies
DROP POLICY IF EXISTS "Users can only view their own data" ON public.creative_assets;
DROP POLICY IF EXISTS "Users can only insert their own data" ON public.creative_assets;
DROP POLICY IF EXISTS "Users can only update their own data" ON public.creative_assets;
DROP POLICY IF EXISTS "Users can only delete their own data" ON public.creative_assets;

CREATE POLICY "Users can only view their own data" ON public.creative_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own data" ON public.creative_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own data" ON public.creative_assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own data" ON public.creative_assets FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable Realtime (Safe Re-run)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'creative_assets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_assets;
    END IF;
END;
$$;

