import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarSync } from '@/lib/google-calendar-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { calendarId } = body;
    
    // Await params in Next.js 15
    const { id } = await params;

    // Export event to Google Calendar
    const success = await googleCalendarSync.exportEvent(id, calendarId);

    if (!success) {
      throw new Error('Failed to export event');
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error exporting event:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to export event',
        details: error 
      },
      { status: 500 }
    );
  }
}