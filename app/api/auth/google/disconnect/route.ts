import { NextResponse } from 'next/server';
import { googleAuth } from '@/lib/google-auth';

export async function POST() {
  try {
    const success = await googleAuth.revokeAuthorization();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect Google Calendar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}