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