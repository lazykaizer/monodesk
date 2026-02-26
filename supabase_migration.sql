-- ############################################################
-- # MONODESK COMPREHENSIVE DATABASE SCHEMA
-- ############################################################
-- # This script sets up the complete database for Monodesk.
-- # Requirement: Multi-tenancy, RLS, and strict persistence.
-- ############################################################

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function to auto-update 'updated_at' column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE DEFINITIONS

-- PROFILES: Links to auth.users, stores user metadata
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

-- IDEAS: Idea Validator storage
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


-- STRATEGIES: Strategy Deck storage
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

-- ROADMAPS: Roadmap Engine storage
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

-- FINANCE_RECORDS: Finance View storage
CREATE TABLE IF NOT EXISTS public.finance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCE_REPORTS: Stored financial analysis reports
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

-- CREATIVE_ASSETS: Creative Studio storage
CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_type TEXT CHECK (asset_type IN ('image', 'video', 'logo', 'agency')) NOT NULL,
    storage_path TEXT NOT NULL,
    prompt_used TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PITCH_DECKS: Pitch Deck storage
CREATE TABLE IF NOT EXISTS public.pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_title TEXT NOT NULL,
    slides_content JSONB,
    theme_config JSONB,
    idea TEXT, -- Added idea column
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAFETY: Ensure 'idea' column exists even if table was created previously without it
ALTER TABLE public.pitch_decks ADD COLUMN IF NOT EXISTS idea TEXT;

-- FORCE CACHE REFRESH by modifying metadata
COMMENT ON TABLE public.pitch_decks IS 'Pitch decks for users (Schema Refreshed)';
NOTIFY pgrst, 'reload config';

-- TRENDS: Trend Hunter storage
CREATE TABLE IF NOT EXISTS public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    sector TEXT,
    analysis_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- NOTIFICATIONS: System and user-specific alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_global BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUTOMATION & TRIGGERS

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if rerun
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers for all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'ideas', 'personas', 'strategies', 'roadmaps', 'finance_records', 'finance_reports', 'creative_assets', 'pitch_decks', 'trends', 'persona_tests', 'notifications')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp_trigger ON %I', t);
        EXECUTE format('CREATE TRIGGER update_timestamp_trigger BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_timestamp()', t);
    END LOOP;
END;
$$;

-- 4. SECURITY POLICIES (RLS)

-- Function to enable RLS and add strict ownership policies to a table
CREATE OR REPLACE FUNCTION enable_strict_rls(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    -- Delete existing policies to prevent "already exists" errors
    EXECUTE format('DROP POLICY IF EXISTS "Users can only view their own data" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can only insert their own data" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can only update their own data" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can only delete their own data" ON public.%I', table_name);

    -- Create policies
    EXECUTE format('CREATE POLICY "Users can only view their own data" ON public.%I FOR SELECT USING (auth.uid() = user_id)', table_name);
    EXECUTE format('CREATE POLICY "Users can only insert their own data" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name);
    EXECUTE format('CREATE POLICY "Users can only update their own data" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', table_name);
    EXECUTE format('CREATE POLICY "Users can only delete their own data" ON public.%I FOR DELETE USING (auth.uid() = user_id)', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply RLS to all tables
SELECT enable_strict_rls('profiles');
SELECT enable_strict_rls('ideas');

SELECT enable_strict_rls('strategies');
SELECT enable_strict_rls('roadmaps');
SELECT enable_strict_rls('finance_records');
SELECT enable_strict_rls('creative_assets');
SELECT enable_strict_rls('pitch_decks');
SELECT enable_strict_rls('trends');
SELECT enable_strict_rls('finance_reports');
SELECT enable_strict_rls('notifications');

-- 5. REALTIME CONFIGURATION
-- Enable Realtime for critical tables safely
DO $$
DECLARE
    t text;
    tables_to_add text[] := ARRAY['profiles', 'ideas', 'finance_records', 'roadmaps', 'creative_assets', 'finance_reports', 'notifications'];
BEGIN
    FOR t IN SELECT unnest(tables_to_add) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        END IF;
    END LOOP;
END;
$$;

