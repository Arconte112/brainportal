-- Google Calendar Integration Database Schema
-- Run this in your Supabase SQL editor after the main database setup

-- First, check if events table exists, if not create it
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    location TEXT,
    all_day BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    reminder_minutes INTEGER,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Google Calendar sync fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_etag TEXT;

-- Create indexes for Google sync fields
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON public.events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_google_calendar_id ON public.events(google_calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_sync_status ON public.events(sync_status);

-- Create google_calendar_config table for storing OAuth tokens and settings
CREATE TABLE IF NOT EXISTS public.google_calendar_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT, -- For future multi-user support
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE,
    selected_calendars JSONB DEFAULT '[]'::jsonb,
    sync_enabled BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 15,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create google_calendars table to cache calendar metadata
CREATE TABLE IF NOT EXISTS public.google_calendars (
    id TEXT PRIMARY KEY, -- Google Calendar ID
    config_id UUID NOT NULL REFERENCES public.google_calendar_config(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    description TEXT,
    time_zone TEXT,
    is_primary BOOLEAN DEFAULT false,
    access_role TEXT,
    background_color TEXT,
    foreground_color TEXT,
    selected BOOLEAN DEFAULT true,
    last_synced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sync_log table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.google_sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    config_id UUID REFERENCES public.google_calendar_config(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'webhook')),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    imported_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    conflicts JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add updated_at trigger for events table if it doesn't exist
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for google_calendar_config
DROP TRIGGER IF EXISTS update_google_calendar_config_updated_at ON public.google_calendar_config;
CREATE TRIGGER update_google_calendar_config_updated_at
    BEFORE UPDATE ON public.google_calendar_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for google_calendars
DROP TRIGGER IF EXISTS update_google_calendars_updated_at ON public.google_calendars;
CREATE TRIGGER update_google_calendars_updated_at
    BEFORE UPDATE ON public.google_calendars
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on events" ON public.events
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on google_calendar_config" ON public.google_calendar_config
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on google_calendars" ON public.google_calendars
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on google_sync_log" ON public.google_sync_log
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_end_time ON public.events(end_time);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_google_calendars_config_id ON public.google_calendars(config_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_log_config_id ON public.google_sync_log(config_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_log_started_at ON public.google_sync_log(started_at);

-- Create a view for events with project info
CREATE OR REPLACE VIEW public.events_with_projects AS
SELECT 
    e.*,
    p.name as project_name,
    p.color as project_color
FROM public.events e
LEFT JOIN public.projects p ON e.project_id = p.id
ORDER BY e.start_time;

-- Create a view for sync status overview
CREATE OR REPLACE VIEW public.google_sync_status AS
SELECT 
    gc.id,
    gc.sync_enabled,
    gc.last_sync,
    gc.sync_interval_minutes,
    COUNT(DISTINCT gcal.id) as calendar_count,
    COUNT(DISTINCT e.id) FILTER (WHERE e.sync_status = 'synced') as synced_events,
    COUNT(DISTINCT e.id) FILTER (WHERE e.sync_status = 'pending') as pending_events,
    COUNT(DISTINCT e.id) FILTER (WHERE e.sync_status = 'error') as error_events,
    COUNT(DISTINCT e.id) FILTER (WHERE e.sync_status = 'conflict') as conflict_events,
    MAX(sl.started_at) as last_sync_attempt,
    MAX(sl.completed_at) FILTER (WHERE sl.status = 'completed') as last_successful_sync
FROM public.google_calendar_config gc
LEFT JOIN public.google_calendars gcal ON gc.id = gcal.config_id
LEFT JOIN public.events e ON gcal.id = e.google_calendar_id
LEFT JOIN public.google_sync_log sl ON gc.id = sl.config_id
GROUP BY gc.id;