-- Add missing columns to events table for Google Calendar integration
-- This migration adds columns that may be missing if the events table already existed

-- Add location column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add all_day column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;

-- Add recurring column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;

-- Add recurrence_rule column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

-- Add reminder_minutes column if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER;

-- Add Google Calendar sync fields if they don't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'conflict')),
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_etag TEXT;

-- Add created_at and updated_at if they don't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON public.events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_google_calendar_id ON public.events(google_calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_sync_status ON public.events(sync_status);

-- Add the updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();