"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Task, Project, Note, Reminder } from '@/types';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/constants';

// Global cache for data sharing across components
const globalCache = {
  tasks: [] as Task[],
  projects: [] as Project[],
  notes: [] as Note[],
  reminders: [] as Reminder[],
  listeners: new Set<() => void>(),
  subscriptions: {} as Record<string, any>,
  lastFetch: {
    tasks: 0,
    projects: 0,
    notes: 0,
    reminders: 0
  }
};


export function useRealtimeData() {
  const [tasks, setTasks] = useState<Task[]>(globalCache.tasks);
  const [projects, setProjects] = useState<Project[]>(globalCache.projects);
  const [notes, setNotes] = useState<Note[]>(globalCache.notes);
  const [reminders, setReminders] = useState<Reminder[]>(globalCache.reminders);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  
  const forceUpdate = useRef<() => void>(() => {});

  // Force update function
  const triggerUpdate = useCallback(() => {
    setTasks([...globalCache.tasks]);
    setProjects([...globalCache.projects]);
    setNotes([...globalCache.notes]);
    setReminders([...globalCache.reminders]);
  }, []);

  forceUpdate.current = triggerUpdate;

  // Register component for updates
  useEffect(() => {
    globalCache.listeners.add(triggerUpdate);
    return () => {
      globalCache.listeners.delete(triggerUpdate);
    };
  }, [triggerUpdate]);

  // Notify all listeners of data changes
  const notifyListeners = useCallback(() => {
    globalCache.listeners.forEach(listener => listener());
  }, []);

  // Load tasks with caching
  const loadTasks = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - globalCache.lastFetch.tasks < CACHE.DURATION_MS && globalCache.tasks.length > 0) {
      setLoadingTasks(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          project_id,
          task_note_links(note_id)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error loading tasks', error, 'RealtimeData');
        return;
      }

      if (data) {
        const transformedTasks = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.due_date ?? undefined,
          description: t.description ?? undefined,
          projectId: t.project_id ?? undefined,
          linkedNoteIds: Array.isArray(t.task_note_links)
            ? t.task_note_links.map((link: any) => link.note_id)
            : [],
        }));

        globalCache.tasks = transformedTasks;
        globalCache.lastFetch.tasks = now;
        notifyListeners();
      }
    } catch (error) {
      logger.error('Error loading tasks', error, 'RealtimeData');
    } finally {
      setLoadingTasks(false);
    }
  }, [notifyListeners]);

  // Load projects with caching
  const loadProjects = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - globalCache.lastFetch.projects < CACHE.DURATION_MS && globalCache.projects.length > 0) {
      setLoadingProjects(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,description,color,archived')
        .eq('archived', false)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error loading projects', error, 'RealtimeData');
        return;
      }

      globalCache.projects = data ?? [];
      globalCache.lastFetch.projects = now;
      notifyListeners();
    } catch (error) {
      logger.error('Error loading projects', error, 'RealtimeData');
    } finally {
      setLoadingProjects(false);
    }
  }, [notifyListeners]);

  // Load notes with caching
  const loadNotes = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - globalCache.lastFetch.notes < CACHE.DURATION_MS && globalCache.notes.length > 0) {
      setLoadingNotes(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id,title,content,project_id,date')
        .order('date', { ascending: false });

      if (error) {
        logger.error('Error loading notes', error, 'RealtimeData');
        return;
      }

      const transformedNotes = (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content ?? '',
        projectId: n.project_id ?? undefined,
        date: n.date,
      }));

      globalCache.notes = transformedNotes;
      globalCache.lastFetch.notes = now;
      notifyListeners();
    } catch (error) {
      logger.error('Error loading notes', error, 'RealtimeData');
    } finally {
      setLoadingNotes(false);
    }
  }, [notifyListeners]);

  // Load reminders with caching
  const loadReminders = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - globalCache.lastFetch.reminders < CACHE.DURATION_MS && globalCache.reminders.length > 0) {
      setLoadingReminders(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('date_time', { ascending: true });

      if (error) {
        logger.error('Error loading reminders', error, 'RealtimeData');
        return;
      }

      const transformedReminders = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || undefined,
        dateTime: r.date_time,
        status: r.status,
        soundEnabled: r.sound_enabled ?? true,
      }));

      globalCache.reminders = transformedReminders;
      globalCache.lastFetch.reminders = now;
      notifyListeners();
    } catch (error) {
      logger.error('Error loading reminders', error, 'RealtimeData');
    } finally {
      setLoadingReminders(false);
    }
  }, [notifyListeners]);

  // Initialize real-time subscriptions
  useEffect(() => {
    // Load initial data
    loadTasks();
    loadProjects();
    loadNotes();
    loadReminders();

    // Set up real-time subscriptions only once
    if (!globalCache.subscriptions.tasks) {
      globalCache.subscriptions.tasks = supabase
        .channel('global-tasks-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          logger.debug('Task change detected', payload, 'RealtimeData');
          loadTasks(true);
        })
        .subscribe();
    }

    if (!globalCache.subscriptions.projects) {
      globalCache.subscriptions.projects = supabase
        .channel('global-projects-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects'
        }, () => {
          loadProjects(true);
        })
        .subscribe();
    }

    if (!globalCache.subscriptions.notes) {
      globalCache.subscriptions.notes = supabase
        .channel('global-notes-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notes'
        }, () => {
          loadNotes(true);
        })
        .subscribe();
    }

    if (!globalCache.subscriptions.reminders) {
      globalCache.subscriptions.reminders = supabase
        .channel('global-reminders-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reminders'
        }, () => {
          loadReminders(true);
        })
        .subscribe();
    }

    // Cleanup function for when the app unmounts
    return () => {
      // Don't unsubscribe individual components, only when app unmounts
    };
  }, [loadTasks, loadProjects, loadNotes, loadReminders]);

  // Optimistic update functions
  const updateTaskOptimistic = useCallback((taskId: string, updates: Partial<Task>) => {
    const taskIndex = globalCache.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      globalCache.tasks[taskIndex] = { ...globalCache.tasks[taskIndex], ...updates };
      notifyListeners();
    }
  }, [notifyListeners]);

  const addTaskOptimistic = useCallback((task: Task) => {
    globalCache.tasks.push(task);
    notifyListeners();
  }, [notifyListeners]);

  const removeTaskOptimistic = useCallback((taskId: string) => {
    globalCache.tasks = globalCache.tasks.filter(t => t.id !== taskId);
    notifyListeners();
  }, [notifyListeners]);

  const updateProjectOptimistic = useCallback((projectId: string, updates: Partial<Project>) => {
    const projectIndex = globalCache.projects.findIndex(p => p.id === projectId);
    if (projectIndex >= 0) {
      globalCache.projects[projectIndex] = { ...globalCache.projects[projectIndex], ...updates };
      notifyListeners();
    }
  }, [notifyListeners]);

  const addProjectOptimistic = useCallback((project: Project) => {
    globalCache.projects.push(project);
    notifyListeners();
  }, [notifyListeners]);

  const updateNoteOptimistic = useCallback((noteId: string, updates: Partial<Note>) => {
    const noteIndex = globalCache.notes.findIndex(n => n.id === noteId);
    if (noteIndex >= 0) {
      globalCache.notes[noteIndex] = { ...globalCache.notes[noteIndex], ...updates };
      notifyListeners();
    }
  }, [notifyListeners]);

  const addNoteOptimistic = useCallback((note: Note) => {
    globalCache.notes.unshift(note); // Add to beginning for recent notes first
    notifyListeners();
  }, [notifyListeners]);

  const removeNoteOptimistic = useCallback((noteId: string) => {
    globalCache.notes = globalCache.notes.filter(n => n.id !== noteId);
    notifyListeners();
  }, [notifyListeners]);

  // Optimistic reminder functions
  const updateReminderOptimistic = useCallback((reminderId: string, updates: Partial<Reminder>) => {
    const reminderIndex = globalCache.reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex >= 0) {
      globalCache.reminders[reminderIndex] = { ...globalCache.reminders[reminderIndex], ...updates };
      notifyListeners();
    }
  }, [notifyListeners]);

  const addReminderOptimistic = useCallback((reminder: Reminder) => {
    globalCache.reminders.push(reminder);
    notifyListeners();
  }, [notifyListeners]);

  const removeReminderOptimistic = useCallback((reminderId: string) => {
    globalCache.reminders = globalCache.reminders.filter(r => r.id !== reminderId);
    notifyListeners();
  }, [notifyListeners]);

  return {
    // Data
    tasks,
    projects,
    notes,
    reminders,
    
    // Loading states
    loadingTasks,
    loadingProjects,
    loadingNotes,
    loadingReminders,
    
    // Reload functions
    reloadTasks: () => loadTasks(true),
    reloadProjects: () => loadProjects(true),
    reloadNotes: () => loadNotes(true),
    reloadReminders: () => loadReminders(true),
    
    // Optimistic update functions
    updateTaskOptimistic,
    addTaskOptimistic,
    removeTaskOptimistic,
    updateProjectOptimistic,
    addProjectOptimistic,
    updateNoteOptimistic,
    addNoteOptimistic,
    removeNoteOptimistic,
    updateReminderOptimistic,
    addReminderOptimistic,
    removeReminderOptimistic
  };
}

// Cleanup function to call when app unmounts
export const cleanupRealtimeSubscriptions = () => {
  Object.values(globalCache.subscriptions).forEach(subscription => {
    if (subscription?.unsubscribe) {
      subscription.unsubscribe();
    }
  });
  globalCache.subscriptions = {};
};