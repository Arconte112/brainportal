import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarSync } from '@/lib/google-calendar-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendarId } = body;

    // Sync events
    const result = await googleCalendarSync.syncEvents(calendarId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to sync calendar',
        details: error 
      },
      { status: 500 }
    );
  }
}