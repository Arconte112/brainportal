-- Cerebro AI Chat System Database Schema
-- Run this in your Supabase SQL editor

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    token_count INTEGER DEFAULT 0 NOT NULL,
    max_tokens INTEGER DEFAULT 20000 NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tool_calls JSONB,
    tool_results JSONB
);

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model TEXT NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7 NOT NULL CHECK (temperature >= 0 AND temperature <= 2),
    max_context_tokens INTEGER DEFAULT 20000 NOT NULL CHECK (max_context_tokens > 0),
    api_key TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('openrouter', 'openai', 'anthropic')),
    enabled_tools JSONB DEFAULT '[]'::jsonb NOT NULL,
    system_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on your auth requirements)
-- For development/single-user, these policies allow all operations
CREATE POLICY "Allow all operations on chat_sessions" ON public.chat_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on ai_settings" ON public.ai_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default AI settings if none exist
INSERT INTO public.ai_settings (
    model,
    temperature,
    max_context_tokens,
    provider,
    enabled_tools,
    system_prompt
) 
SELECT 
    'anthropic/claude-3.5-sonnet',
    0.7,
    20000,
    'openrouter',
    '["create_task", "create_project", "create_note", "create_reminder", "get_tasks", "get_projects"]'::jsonb,
    'Eres Cerebro, el asistente de IA de BrainPortal. Tu función es ayudar al usuario con la gestión de tareas, proyectos, notas y recordatorios.

Capabilities:
- Crear, editar y gestionar tareas con prioridades y fechas límite
- Organizar proyectos y asociar tareas con ellos
- Crear notas y vincularlas con tareas o proyectos
- Establecer recordatorios con fechas específicas
- Analizar productividad y ofrecer insights
- Sugerir optimizaciones en el flujo de trabajo

Responde siempre en español y sé conciso pero útil. Prioriza las acciones que el usuario necesita completar.'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings);

-- Create a view for easy session management with message counts
CREATE OR REPLACE VIEW public.chat_sessions_with_stats AS
SELECT 
    s.*,
    COALESCE(msg_count.count, 0) as message_count,
    COALESCE(last_msg.last_message_at, s.created_at) as last_message_at
FROM public.chat_sessions s
LEFT JOIN (
    SELECT 
        session_id, 
        COUNT(*) as count
    FROM public.chat_messages 
    GROUP BY session_id
) msg_count ON s.id = msg_count.session_id
LEFT JOIN (
    SELECT 
        session_id,
        MAX(created_at) as last_message_at
    FROM public.chat_messages
    GROUP BY session_id
) last_msg ON s.id = last_msg.session_id
ORDER BY COALESCE(last_msg.last_message_at, s.created_at) DESC;