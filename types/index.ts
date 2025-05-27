// Tipos centrales de la aplicación

export interface Task {
  id: string;
  title: string;
  status: "pending" | "done";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  description?: string;
  projectId?: string;
  linkedNoteIds?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  archived?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string | null;
  date: string;
}

// Tipos específicos para diálogos y componentes que pueden tener campos adicionales
export interface NoteDialogData {
  id?: string;
  title: string;
  content: string;
  date: string;
  projectId?: string | null;
  taskId?: string | null;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dateTime: string; // ISO string format for date and time
  status: "pending" | "completed" | "dismissed";
  soundEnabled?: boolean;
}

export interface DatabaseNote {
  id: string;
  title: string;
  content: string | null;
  project_id: string | null;
  date: string;
  projects?: {
    name: string;
    color: string;
  }[];
}

// AI Chat Types
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  token_count: number;
  max_tokens: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_count: number;
  created_at: string;
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  result: string;
  success: boolean;
}

export interface AISettings {
  id?: string;
  model: string;
  temperature: number;
  max_context_tokens: number;
  api_key?: string;
  provider: 'openrouter' | 'openai' | 'anthropic';
  enabled_tools: string[];
  system_prompt?: string;
}

export interface AIProvider {
  name: string;
  models: string[];
  max_tokens: number;
  supports_tools: boolean;
}