-- ############################################################
-- # MONODESK PERSONA MODULE SETUP (DEDICATED SCRIPT)
-- ############################################################
-- # Run this script in a fresh SQL Editor tab to setup or 
-- # HARD RESET the Persona Lab.
-- ############################################################

-- 1. CLEANUP (WARNING: CASCADE will delete your custom personas!)
-- Only run these DROP statements if you want a TOTAL WIPE.
-- DROP TABLE IF EXISTS public.persona_tests CASCADE;
-- DROP TABLE IF EXISTS public.personas CASCADE;

-- 2. CREATE PERSONAS TABLE (Safe & Idempotent)
CREATE TABLE IF NOT EXISTS public.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL allowed for system personas
    name TEXT NOT NULL,
    role TEXT, -- Professional designation (e.g., "Skeptical VC")
    avatar_url TEXT, -- Profile image URL
    bio TEXT, -- Deep personality description for AI simulation
    is_system BOOLEAN DEFAULT false, -- True for the 3 default advisors
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE PERSONA_TESTS TABLE (Safe & Idempotent)
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

-- 4. SEED DATA (Safe Upsert)
INSERT INTO public.personas (id, name, role, avatar_url, bio, is_system) 
VALUES 
('11111111-1111-1111-1111-111111111111', 'Sophia', 'Skeptical VC', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80', 'Ruthless Venture Capitalist. Care only about ROI, scalability, and exit strategy. Ask tough questions about money. Be skeptical of buzzwords.', true),
('22222222-2222-2222-2222-222222222222', 'Chloe', 'Gen Z Trendsetter', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80', 'Hyper-trendy Gen Z user. Use slang, care about aesthetics, vibes, and social clout. Hate boring corporate stuff. Use emojis.', true),
('33333333-3333-3333-3333-333333333333', 'Olivia', 'Senior Engineer', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&q=80', 'Cynical Senior Developer. Care about technical debt, security risks, scalability, and feasibility. Hate marketing fluff.', true)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    is_system = EXCLUDED.is_system;

-- 5. SECURITY POLICIES (RLS)
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_tests ENABLE ROW LEVEL SECURITY;

-- Logic: View own or system-wide (system = is_system is true), but only manage your own.
DROP POLICY IF EXISTS "View personas" ON public.personas;
CREATE POLICY "View personas" ON public.personas FOR SELECT USING (auth.uid() = user_id OR is_system = true);

-- Bulletproof Management Policy (Ensures you can only touch YOUR data)
DROP POLICY IF EXISTS "Manage own personas" ON public.personas;
CREATE POLICY "Manage own personas" ON public.personas FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own tests" ON public.persona_tests;
CREATE POLICY "Manage own tests" ON public.persona_tests FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. AUTOMATION TRIGGERS
-- Re-using the update_timestamp function if it exists, otherwise create it.
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_personas_timestamp ON public.personas;
CREATE TRIGGER update_personas_timestamp BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_persona_tests_timestamp ON public.persona_tests;
CREATE TRIGGER update_persona_tests_timestamp BEFORE UPDATE ON public.persona_tests FOR EACH ROW EXECUTE FUNCTION update_timestamp();
