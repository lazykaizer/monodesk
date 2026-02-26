-- ############################################################
-- # MONODESK FULL SYSTEM INITIALIZATION
-- ############################################################

-- 1. PITCH DECKS TABLE
CREATE TABLE IF NOT EXISTS public.pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_title TEXT,
    idea TEXT,
    slides_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

-- 2. PROJECTS TABLE (KNOWLEDGE BASE)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    knowledge_base JSONB DEFAULT '{}'::jsonb,
    style_guide JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES (PITCH DECKS)
DROP POLICY IF EXISTS "Users can manage own decks" ON public.pitch_decks;
CREATE POLICY "Users can manage own decks" ON public.pitch_decks
    FOR ALL USING (auth.uid() = user_id);

-- 4. POLICIES (PROJECTS)
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- 5. STORAGE BUCKET (pitch_deck_images)
-- Note: Buckets must be created via the UI or API first, 
-- but we can set permissions via SQL.
-- Ensure bucket 'pitch_deck_images' is created in Supabase UI and set to PUBLIC.

-- Storage Policies for 'pitch_deck_images'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'pitch_deck_images');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pitch_deck_images');

DROP POLICY IF EXISTS "Owner Management" ON storage.objects;
CREATE POLICY "Owner Management" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'pitch_deck_images');

-- 6. TRIGGER FOR TIMESTAMPS
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pitch_decks_timestamp ON public.pitch_decks;
CREATE TRIGGER update_pitch_decks_timestamp BEFORE UPDATE ON public.pitch_decks FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_timestamp();

NOTIFY pgrst, 'reload config';
