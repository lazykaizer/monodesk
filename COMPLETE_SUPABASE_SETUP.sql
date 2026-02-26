-- ############################################################
-- # MONODESK FINAL MASTER SETUP (VERIFIED & CLEAN)
-- ############################################################

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Global trigger function for 'updated_at'
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLES SETUP
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    plan_tier TEXT DEFAULT 'free',
    credits_balance INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    market_score NUMERIC(5,2),
    target_audience TEXT,
    validation_report JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL,
    lean_canvas_data JSONB,
    swot_analysis JSONB,
    gtm_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    milestones JSONB DEFAULT '[]'::jsonb,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'planning',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    currency TEXT DEFAULT 'USD',
    original_amount NUMERIC,
    exchange_rate NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_name TEXT NOT NULL,
    total_transactions INTEGER,
    net_value NUMERIC(12,2),
    analysis_content JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    prompt_used TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT creative_assets_asset_type_check CHECK (asset_type IN ('image', 'video', 'logo', 'agency'))
);

CREATE TABLE IF NOT EXISTS public.pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_title TEXT NOT NULL,
    slides_content JSONB,
    theme_config JSONB,
    idea TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    sector TEXT,
    analysis_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.persona_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    persona_name TEXT,
    prompt TEXT,
    response TEXT,
    full_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_global BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_id)
);

-- 3. SEED SYSTEM PERSONAS
INSERT INTO public.personas (id, name, role, avatar_url, bio, is_system) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'Sophia', 'Skeptical VC', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80', 'Ruthless Venture Capitalist.', true),
('22222222-2222-2222-2222-222222222222', 'Chloe', 'Gen Z Trendsetter', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80', 'Hyper-trendy Gen Z user.', true),
('33333333-3333-3333-3333-333333333333', 'Olivia', 'Senior Engineer', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&q=80', 'Cynical Senior Developer.', true)
ON CONFLICT (id) DO NOTHING;

-- 4. AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    INSERT INTO public.notifications (title, message, type, user_id, is_global)
    VALUES ('Welcome to the Monodesk Elite! 🚀', 'Welcome to Monodesk.', 'success', NEW.id, false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'projects', 'ideas', 'strategies', 'roadmaps', 'finance_records', 'finance_reports', 'creative_assets', 'pitch_decks', 'trends', 'personas', 'persona_tests', 'notifications')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp_trigger ON public.%I', t);
        EXECUTE format('CREATE TRIGGER update_timestamp_trigger BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_timestamp()', t);
    END LOOP;
END;
$$;

-- 5. RLS POLICIES (Tables)
CREATE OR REPLACE FUNCTION enable_strict_rls(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "CRUD Policy" ON public.%I', table_name);
    EXECUTE format('CREATE POLICY "CRUD Policy" ON public.%I FOR ALL USING (auth.uid() = user_id)', table_name);
END;
$$ LANGUAGE plpgsql;

SELECT enable_strict_rls('profiles');
SELECT enable_strict_rls('projects');
SELECT enable_strict_rls('ideas');
SELECT enable_strict_rls('strategies');
SELECT enable_strict_rls('roadmaps');
SELECT enable_strict_rls('finance_records');
SELECT enable_strict_rls('finance_reports');
SELECT enable_strict_rls('creative_assets');
SELECT enable_strict_rls('pitch_decks');
SELECT enable_strict_rls('trends');
SELECT enable_strict_rls('persona_tests');
SELECT enable_strict_rls('notification_reads');

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Select Notifications" ON public.notifications;
CREATE POLICY "Select Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR is_global = true);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Select Personas" ON public.personas;
CREATE POLICY "Select Personas" ON public.personas FOR SELECT USING (auth.uid() = user_id OR is_system = true);
DROP POLICY IF EXISTS "Manage Personas" ON public.personas;
CREATE POLICY "Manage Personas" ON public.personas FOR ALL USING (auth.uid() = user_id);

-- 6. REALTIME
DO $$
DECLARE
    t text;
    tables_to_add text[] := ARRAY['ideas', 'finance_records', 'roadmaps', 'notifications'];
BEGIN
    FOR t IN SELECT unnest(tables_to_add) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = t) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END;
$$;

-- 7. STORAGE POLICIES (EXACTLY LIKE SCREENSHOT)
-- Note: Create 'avatars' bucket in UI and set to Public first.

DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "User Upload Avatars" ON storage.objects;
CREATE POLICY "User Upload Avatars" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "User Update Avatars" ON storage.objects;
CREATE POLICY "User Update Avatars" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "User Delete Avatars" ON storage.objects;
CREATE POLICY "User Delete Avatars" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'avatars');

NOTIFY pgrst, 'reload config';
