-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: if null, it's a global notification
    is_global BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false -- Used for personal notifications
);

-- Table to track which users have read/dismissed global notifications
CREATE TABLE IF NOT EXISTS public.notification_reads (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, notification_id)
);

-- Enable RLS for reads
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification reads" 
ON public.notification_reads 
FOR ALL 
USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Users can read their own or global notifications" ON public.notifications;

-- Create policy to allow all authenticated users to read notifications
CREATE POLICY "Users can read their own or global notifications" 
ON public.notifications 
FOR SELECT 
USING (
    auth.uid() = user_id OR is_global = true
);

-- Enable Realtime for the table safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Function to handle new user welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (title, message, type, user_id, is_global)
    VALUES (
        'Welcome to the Monodesk Elite! 🚀',
        'Welcome!

We''re absolutely thrilled to have you on board! You''ve just taken the first step towards building something extraordinary. Explore our AI-powered validator, manage your finances with precision, and scale your vision using our creative studio. Our mission is to empower founders like you with the tools needed to turn ideas into reality. Let''s get started on your journey to success!',
        'success',
        NEW.id,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user welcome
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_welcome();
