-- ############################################################
-- # HARD RESET PITCH DECKS TABLE
-- ############################################################
-- # WARNING: THIS WILL DELETE ALL PITCH DECK DATA
-- # Use this to fix the "Could not find 'idea' column" error once and for all.
-- ############################################################

-- 1. Nuke the table (Force clean slate)
DROP TABLE IF EXISTS public.pitch_decks CASCADE;

-- 2. Re-create with ALL required columns explicitly
CREATE TABLE public.pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_title TEXT,
    idea TEXT, -- <--- The missing column causing the error
    slides_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Security (RLS)
ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

-- Simple, permissive policy for the owner
CREATE POLICY "Owner Manage Everything" ON public.pitch_decks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Auto-timestamp
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pitch_decks_timestamp 
BEFORE UPDATE ON public.pitch_decks 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 5. Force Schema Cache Refresh (Critical)
NOTIFY pgrst, 'reload config';
