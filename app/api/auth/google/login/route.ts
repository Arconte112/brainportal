import { NextResponse } from 'next/server';
import { googleAuth } from '@/lib/google-auth';

export async function GET() {
  try {
    // Generate Google OAuth URL
    const authUrl = googleAuth.getAuthUrl();
    
    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}