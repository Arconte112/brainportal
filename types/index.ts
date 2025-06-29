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

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO string format
  end_time: string; // ISO string format
  priority: "high" | "medium" | "low";
  location?: string;
  all_day?: boolean;
  recurring?: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  project_id?: string;
  // Google Calendar sync fields
  google_event_id?: string;
  google_calendar_id?: string;
  sync_status?: "pending" | "synced" | "error" | "conflict";
  last_synced?: string;
  google_etag?: string; // For detecting changes
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

// Google Calendar Integration Types
export interface GoogleCalendarConfig {
  id: string;
  user_id?: string;
  access_token: string;
  refresh_token: string;
  token_expiry?: string;
  selected_calendars?: string[];
  sync_enabled: boolean;
  sync_interval_minutes?: number;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface SyncResult {
  imported: number;
  updated: number;
  errors: number;
  conflicts: string[];
  lastSync: string;
}