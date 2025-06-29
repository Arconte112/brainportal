import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getTokenCount, getMessagesTokenCount, trimMessagesToTokenLimit } from '@/lib/token-utils';
import { AVAILABLE_TOOLS, DEFAULT_AI_SETTINGS } from '@/lib/ai-config';
import { ChatMessage, ToolCall, ToolResult } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Initialize clients inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: 'https://openrouter.ai/api/v1',
  });
  try {
    const { sessionId, message, settings } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Get current session
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get AI settings (merge with defaults)
    const aiSettings = { ...DEFAULT_AI_SETTINGS, ...settings };

    // Store user message
    const userMessage: Omit<ChatMessage, 'id'> = {
      session_id: sessionId,
      role: 'user',
      content: message,
      token_count: getTokenCount(message, aiSettings.model),
      created_at: new Date().toISOString(),
    };

    const { data: savedUserMessage } = await supabase
      .from('chat_messages')
      .insert(userMessage)
      .select()
      .single();

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!messages) {
      return NextResponse.json(
        { error: 'Failed to retrieve messages' },
        { status: 500 }
      );
    }

    // Trim messages to fit context window
    const trimmedMessages = trimMessagesToTokenLimit(
      messages,
      aiSettings.max_context_tokens,
      aiSettings.model
    );

    // Add system message if not present
    const systemMessage = {
      role: 'system' as const,
      content: aiSettings.system_prompt || DEFAULT_AI_SETTINGS.system_prompt,
    };

    const openaiMessages = [
      systemMessage,
      ...trimmedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        tool_calls: msg.tool_calls,
        tool_call_id: msg.tool_results?.[0]?.tool_call_id,
      })),
    ].filter(msg => msg.content.trim().length > 0);

    // Prepare tools for OpenAI
    const tools = aiSettings.enabled_tools.map((toolName: string) => ({
      type: 'function' as const,
      function: AVAILABLE_TOOLS[toolName as keyof typeof AVAILABLE_TOOLS],
    }));

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: aiSettings.model,
      messages: openaiMessages,
      temperature: aiSettings.temperature,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    });

    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Handle tool calls if present
    let toolResults: ToolResult[] = [];
    if (assistantMessage.tool_calls) {
      toolResults = await handleToolCalls(assistantMessage.tool_calls);
    }

    // Store assistant message
    const assistantMessageData: Omit<ChatMessage, 'id'> = {
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage.content || '',
      token_count: getTokenCount(assistantMessage.content || '', aiSettings.model),
      created_at: new Date().toISOString(),
      tool_calls: assistantMessage.tool_calls as ToolCall[],
      tool_results: toolResults,
    };

    const { data: savedAssistantMessage } = await supabase
      .from('chat_messages')
      .insert(assistantMessageData)
      .select()
      .single();

    // Update session token count
    const totalTokens = getMessagesTokenCount([...messages, savedUserMessage, savedAssistantMessage], aiSettings.model);
    await supabase
      .from('chat_sessions')
      .update({ 
        token_count: totalTokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return NextResponse.json({
      message: savedAssistantMessage,
      toolResults,
      tokenCount: totalTokens,
    });

  } catch (error) {
    logger.error('Chat API error', error, 'ChatAPI');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleToolCalls(toolCalls: any[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    try {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = JSON.parse(args);
      let result: any;

      switch (name) {
        case 'crear_tarea':
          result = await createTask(parsedArgs);
          break;
        case 'crear_proyecto':
          result = await createProject(parsedArgs);
          break;
        case 'crear_nota':
          result = await createNote(parsedArgs);
          break;
        case 'crear_recordatorio':
          result = await createReminder(parsedArgs);
          break;
        case 'obtener_tareas':
          result = await getTasks(parsedArgs);
          break;
        case 'obtener_proyectos':
          result = await getProjects(parsedArgs);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }

      results.push({
        tool_call_id: toolCall.id,
        result: JSON.stringify(result),
        success: !result.error,
      });
    } catch (error) {
      results.push({
        tool_call_id: toolCall.id,
        result: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        success: false,
      });
    }
  }

  return results;
}

// Tool implementation functions
async function createTask(args: any) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: args.title,
      description: args.description,
      priority: args.priority,
      due_date: args.dueDate,
      project_id: args.projectId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, data };
}

async function createProject(args: any) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: args.name,
      description: args.description,
      color: args.color || '#3b82f6',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, data };
}

async function createNote(args: any) {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: args.title,
      content: args.content,
      project_id: args.projectId,
      date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Link to task if specified
  if (args.taskId && data) {
    await supabase
      .from('task_note_links')
      .insert({
        task_id: args.taskId,
        note_id: data.id,
      });
  }

  return { success: true, data };
}

async function createReminder(args: any) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      title: args.title,
      description: args.description,
      date_time: args.dateTime,
      status: 'pending',
      sound_enabled: args.soundEnabled ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, data };
}

async function getTasks(args: any) {
  let query = supabase
    .from('tasks')
    .select('*, projects(name, color)');

  if (args.status) {
    query = query.eq('status', args.status);
  }

  if (args.projectId) {
    query = query.eq('project_id', args.projectId);
  }

  if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { success: true, data };
}

async function getProjects(args: any) {
  let query = supabase
    .from('projects')
    .select('*');

  if (!args.includeArchived) {
    query = query.eq('archived', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { success: true, data };
}