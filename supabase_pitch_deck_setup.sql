-- ############################################################
-- # MONODESK PITCH DECK MODULE SETUP
-- ############################################################
-- # Run this script in the Supabase SQL Editor to fix the "Failed to save" error.
-- ############################################################

-- 1. Create the pitch_decks table
CREATE TABLE IF NOT EXISTS public.pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_title TEXT,
    idea TEXT,
    slides_content JSONB, -- Stores the array of Slide objects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. ENSURE COLUMNS EXIST (In case table already existed without them)
ALTER TABLE public.pitch_decks ADD COLUMN IF NOT EXISTS idea TEXT;
ALTER TABLE public.pitch_decks ADD COLUMN IF NOT EXISTS deck_title TEXT;
ALTER TABLE public.pitch_decks ADD COLUMN IF NOT EXISTS slides_content JSONB;

-- 2. Enable Row Level Security (RLS) - Critical for security
ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (CRUD)

-- Allow users to view their own decks
DROP POLICY IF EXISTS "Users can view own decks" ON public.pitch_decks;
CREATE POLICY "Users can view own decks" ON public.pitch_decks
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own decks
DROP POLICY IF EXISTS "Users can create own decks" ON public.pitch_decks;
CREATE POLICY "Users can create own decks" ON public.pitch_decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own decks
DROP POLICY IF EXISTS "Users can update own decks" ON public.pitch_decks;
CREATE POLICY "Users can update own decks" ON public.pitch_decks
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own decks
DROP POLICY IF EXISTS "Users can delete own decks" ON public.pitch_decks;
CREATE POLICY "Users can delete own decks" ON public.pitch_decks
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pitch_decks_timestamp ON public.pitch_decks;
CREATE TRIGGER update_pitch_decks_timestamp BEFORE UPDATE ON public.pitch_decks FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 5. CRITICAL: FORCE SUPABASE TO REFRESH SCHEMA CACHE
-- This fixes the error: "Could not find the 'idea' column... in the schema cache"
NOTIFY pgrst, 'reload config';
