import { supabase } from './supabaseClient';
import { Task, Project, Note } from '@/types';

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, priority, dueDate, projectId');

  if (error) {
    console.error('Error fetching tasks:', error.message);
    return [];
  }
  return data || [];
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, archived');

  if (error) {
    console.error('Error fetching projects:', error.message);
    return [];
  }
  return data || [];
}

export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, content, date, project_id'); // Selected title and content as they are part of Note, and project_id for projectId

  if (error) {
    console.error('Error fetching notes:', error.message);
    return [];
  }
  
  // Map project_id to projectId
  return (data || []).map(note => ({
    ...note,
    projectId: note.project_id,
  }));
}
