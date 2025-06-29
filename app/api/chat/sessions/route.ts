import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { ChatSession } from '@/types';
import { DEFAULT_AI_SETTINGS } from '@/lib/ai-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - List all chat sessions
export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    logger.error('Error fetching sessions', error, 'SessionsAPI');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new chat session
export async function POST(request: NextRequest) {
  try {
    const { title, maxTokens } = await request.json();

    const sessionData = {
      title: title || `Nueva conversación ${new Date().toLocaleString('es-ES')}`,
      token_count: 0,
      max_tokens: maxTokens || DEFAULT_AI_SETTINGS.max_context_tokens,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    logger.error('Error creating session', error, 'SessionsAPI');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}