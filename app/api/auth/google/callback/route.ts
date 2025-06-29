import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle error from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/settings?error=auth_failed', request.url)
      );
    }

    // Check if we have authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await googleAuth.getTokens(code);
    
    // Save tokens to database
    const config = await googleAuth.saveTokens(tokens);
    
    if (!config) {
      return NextResponse.redirect(
        new URL('/settings?error=save_failed', request.url)
      );
    }

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?success=google_connected', request.url)
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=callback_failed', request.url)
    );
  }
}