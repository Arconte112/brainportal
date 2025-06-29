import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarSync } from '@/lib/google-calendar-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;
    
    // Delete event from Google Calendar
    const success = await googleCalendarSync.deleteGoogleEvent(id);

    if (!success) {
      throw new Error('Failed to unsync event');
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error unsyncing event:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to unsync event',
        details: error 
      },
      { status: 500 }
    );
  }
}