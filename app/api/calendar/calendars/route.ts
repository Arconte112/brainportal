import { NextResponse } from 'next/server';
import { googleCalendarSync } from '@/lib/google-calendar-sync';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Get calendars from database
    const { data: calendars, error } = await supabase
      .from('google_calendars')
      .select('*')
      .order('is_primary', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      calendars: calendars || [],
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Fetch calendars from Google
    const calendars = await googleCalendarSync.fetchCalendars();

    return NextResponse.json({
      success: true,
      calendars,
    });
  } catch (error) {
    console.error('Error fetching Google calendars:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch calendars',
        details: error 
      },
      { status: 500 }
    );
  }
}