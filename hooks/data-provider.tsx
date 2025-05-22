"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useRealtimeData } from './use-realtime-data';

interface DataContextType {
  tasks: any[];
  projects: any[];
  notes: any[];
  loadingTasks: boolean;
  loadingProjects: boolean;
  loadingNotes: boolean;
  updateTaskOptimistic: (taskId: string, updates: any) => void;
  addTaskOptimistic: (task: any) => void;
  removeTaskOptimistic: (taskId: string) => void;
  updateProjectOptimistic: (projectId: string, updates: any) => void;
  addProjectOptimistic: (project: any) => void;
  updateNoteOptimistic: (noteId: string, updates: any) => void;
  addNoteOptimistic: (note: any) => void;
  removeNoteOptimistic: (noteId: string) => void;
  reloadTasks: () => void;
  reloadProjects: () => void;
  reloadNotes: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const dataHook = useRealtimeData();

  return (
    <DataContext.Provider value={dataHook}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}