import { NextResponse } from 'next/server';
import { googleAuth } from '@/lib/google-auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Check if authenticated
    const isAuthenticated = await googleAuth.isAuthenticated();
    
    if (!isAuthenticated) {
      return NextResponse.json({ 
        connected: false,
        config: null 
      });
    }

    // Get configuration details
    const { data: config, error } = await supabase
      .from('google_calendar_config')
      .select(`
        id,
        sync_enabled,
        sync_interval_minutes,
        last_sync,
        created_at,
        updated_at
      `)
      .single();

    if (error || !config) {
      return NextResponse.json({ 
        connected: false,
        config: null 
      });
    }

    // Get calendar count
    const { count: calendarCount } = await supabase
      .from('google_calendars')
      .select('*', { count: 'exact', head: true })
      .eq('config_id', config.id);

    // Get sync statistics
    const { data: syncStats } = await supabase
      .from('google_sync_status')
      .select('*')
      .eq('id', config.id)
      .single();

    return NextResponse.json({
      connected: true,
      config: {
        ...config,
        calendar_count: calendarCount || 0,
        sync_stats: syncStats || null,
      }
    });
  } catch (error) {
    console.error('Error getting Google Calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}