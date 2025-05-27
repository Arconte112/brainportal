import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AISettings } from '@/types';
import { DEFAULT_AI_SETTINGS } from '@/lib/ai-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get AI settings
export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from('ai_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const finalSettings = settings ? { ...DEFAULT_AI_SETTINGS, ...settings } : DEFAULT_AI_SETTINGS;

    return NextResponse.json({ settings: finalSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save/Update AI settings
export async function POST(request: NextRequest) {
  try {
    const newSettings: Partial<AISettings> = await request.json();

    // Validate required fields
    if (!newSettings.model || !newSettings.provider) {
      return NextResponse.json(
        { error: 'Model and provider are required' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('ai_settings')
      .select('id')
      .single();

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('ai_settings')
        .update(newSettings)
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      // Create new settings
      result = await supabase
        .from('ai_settings')
        .insert(newSettings)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: result.data });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}