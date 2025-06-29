"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, CalendarPlus, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/utils/retry';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import type { Project, Task } from '@/types';

interface ProjectCardDropdownProps {
  project: Project;
  tasks: Task[];
  selectedDate: string;
  onTaskDateUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function ProjectCardDropdown({ 
  project, 
  tasks, 
  selectedDate,
  onTaskDateUpdate 
}: ProjectCardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});

  // Filtrar tareas pendientes del proyecto
  const projectTasks = useMemo(() => {
    const filtered = tasks.filter(task => 
      task.projectId === project.id && 
      task.status === 'pending'
    ).sort((a, b) => {
      // Ordenar por prioridad
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Debug: Log para verificar actualizaciones
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Project ${project.name} tasks updated`, {
        taskCount: filtered.length,
        tasksWithToday: filtered.filter(t => t.dueDate === selectedDate).length
      }, 'ProjectCard');
    }
    
    return filtered;
  }, [tasks, project.id, selectedDate]);

  // Contar tareas del proyecto para hoy
  const tasksForToday = useMemo(() => 
    projectTasks.filter(task => task.dueDate === selectedDate).length,
    [projectTasks, selectedDate]
  );

  // Sincronizar el estado local con las tareas
  useEffect(() => {
    const newStates: Record<string, boolean> = {};
    projectTasks.forEach(task => {
      newStates[task.id] = task.dueDate === selectedDate;
    });
    setTaskStates(newStates);
  }, [projectTasks, selectedDate]);

  const handleToggleTaskDate = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isToday = task.dueDate === selectedDate;
    const newDate = isToday ? undefined : selectedDate;
    
    // Actualización del estado local inmediata
    setTaskStates(prev => ({
      ...prev,
      [task.id]: !isToday
    }));
    
    // Actualización optimista inmediata
    onTaskDateUpdate(task.id, { dueDate: newDate });
    
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('tasks')
          .update({ due_date: newDate || null })
          .eq('id', task.id);
        
        if (error) throw error;
      }, {
        maxAttempts: 2,
        onRetry: () => {
          logger.warn('Retrying task date update', null, 'ProjectCard');
        }
      });
      
      toast({
        title: isToday ? "Fecha removida" : "Tarea asignada",
        description: isToday 
          ? `"${task.title}" ya no está programada para hoy`
          : `"${task.title}" se asignó para hoy`,
      });
    } catch (error) {
      logger.error('Error updating task date', error, 'ProjectCard');
      // Revertir actualización optimista y estado local
      onTaskDateUpdate(task.id, { dueDate: task.dueDate });
      setTaskStates(prev => ({
        ...prev,
        [task.id]: task.dueDate === selectedDate
      }));
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de la tarea",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors relative overflow-hidden">
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: project.color }}
      />
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{project.name}</h3>
            {tasksForToday > 0 && (
              <Badge variant="secondary" className="text-xs">
                {tasksForToday} hoy
              </Badge>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        {project.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{projectTasks.length} tareas pendientes</span>
        </div>

        <CollapsibleContent className="mt-4 space-y-2">
          {projectTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No hay tareas pendientes
            </p>
          ) : (
            projectTasks.map(task => {
              const isToday = taskStates[task.id] ?? (task.dueDate === selectedDate);
              
              return (
                <div 
                  key={`${task.id}-${task.dueDate || 'no-date'}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/10 group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.priority === 'high' 
                            ? 'border-destructive text-destructive' 
                            : task.priority === 'medium'
                            ? 'border-yellow-500 text-yellow-500'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {task.priority === 'high' ? 'Alta' : 
                         task.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                      {task.dueDate && task.dueDate !== selectedDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant={isToday ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 ${
                      isToday 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={(e) => handleToggleTaskDate(task, e)}
                    title={isToday ? "Quitar de hoy" : "Asignar para hoy"}
                  >
                    {isToday ? (
                      <CalendarCheck className="h-4 w-4" />
                    ) : (
                      <CalendarPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}