"use client";

import type React from "react";

import { useState, useCallback, useMemo } from "react";
import { useSelectedDate } from "@/hooks/use-selected-date";
import { useData } from "@/hooks/data-provider";
import { supabase } from "@/lib/supabaseClient";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { WeeklyCalendar } from "./weekly-calendar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CalendarOff } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/utils/retry";

import type { Task, Note } from '@/types';

export function Dashboard() {
  const {
    tasks,
    projects,
    notes,
    loadingTasks,
    loadingProjects,
    updateTaskOptimistic,
    addTaskOptimistic,
    updateNoteOptimistic,
    addNoteOptimistic
  } = useData();

  // Día seleccionado en el calendario semanal (YYYY-MM-DD)
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  // Memoizar el filtrado de tareas para evitar recálculos innecesarios
  const { pendingTasks, completedTasks, totalTasksForDate, progressPercentage } = useMemo(() => {
    const pending = tasks.filter(
      (task) => task.status === 'pending' && task.dueDate === selectedDate
    );
    const completed = tasks.filter(
      (task) => task.status === 'done' && task.dueDate === selectedDate
    );
    const total = pending.length + completed.length;
    const progress = total > 0
      ? Math.round((completed.length / total) * 100)
      : 0;

    return {
      pendingTasks: pending,
      completedTasks: completed,
      totalTasksForDate: total,
      progressPercentage: progress
    };
  }, [tasks, selectedDate]);

  // Memoizar el cálculo de la siguiente acción prioritaria
  const nextAction = useMemo(() => {
    // Ordenar tareas pendientes por prioridad y fecha de vencimiento
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      // Primero por prioridad
      const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority as 'high' | 'medium' | 'low'] - priorityOrder[b.priority as 'high' | 'medium' | 'low'];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por fecha de vencimiento (si existe)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // Tareas con fecha de vencimiento tienen prioridad sobre las que no tienen
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });

    return sortedTasks[0] || null;
  }, [pendingTasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: "pending" | "done") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    // Optimistic update - update UI immediately
    updateTaskOptimistic(taskId, { status: targetStatus });

    // Persist to database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: targetStatus })
        .eq('id', taskId);
      
      if (error) {
        logger.error('Error updating task status', error, 'Dashboard');
        // Revert optimistic update on error
        updateTaskOptimistic(taskId, { status: taskToUpdate.status });
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado de la tarea",
          variant: "destructive"
        });
      } else {
        toast({
          title: targetStatus === 'done' ? "¡Tarea completada!" : "Tarea pendiente",
          description: `"${taskToUpdate.title}" se movió a ${targetStatus === 'done' ? 'Hecho' : 'Pendiente'}`,
        });
      }
    } catch (error) {
      logger.error('Error updating task', error, 'Dashboard');
      // Revert on error
      updateTaskOptimistic(taskId, { status: taskToUpdate.status });
    }
  }, [tasks, updateTaskOptimistic]);

  const markTaskDone = useCallback(async (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    // Optimistic update
    updateTaskOptimistic(taskId, { status: "done" });

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);
      
      if (error) {
        logger.error('Error marking task as done', error, 'Dashboard');
        // Revert on error
        updateTaskOptimistic(taskId, { status: "pending" });
      }
    } catch (error) {
      logger.error('Error updating task', error, 'Dashboard');
    }
  }, [tasks, updateTaskOptimistic]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setTaskDialogOpen(true);
  };

  const handleCreateTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "",
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
      description: "",
      linkedNoteIds: [],
    };
    setSelectedTask(newTask);
    setIsNewTask(true);
    setTaskDialogOpen(true);
  };

  // Optimized task update with real-time sync
  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    // Optimistic update
    updateTaskOptimistic(updatedTask.id, updatedTask);
    setTaskDialogOpen(false);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: updatedTask.title,
          description: updatedTask.description ?? null,
          status: updatedTask.status,
          priority: updatedTask.priority,
          due_date: updatedTask.dueDate ?? null,
          project_id: updatedTask.projectId ?? null,
        })
        .eq("id", updatedTask.id)
        .select("*")
        .single();
      
      if (error) {
        logger.error('Error updating task', error, 'Dashboard');
        toast({
          title: "Error",
          description: "No se pudo actualizar la tarea",
          variant: "destructive"
        });
        return;
      }

      // Update note links
      if (updatedTask.linkedNoteIds) {
        // Delete existing links
        await supabase
          .from('task_note_links')
          .delete()
          .eq('task_id', updatedTask.id);
        
        // Insert new links
        if (updatedTask.linkedNoteIds.length > 0) {
          const links = updatedTask.linkedNoteIds.map(noteId => ({
            task_id: updatedTask.id,
            note_id: noteId
          }));
          
          await supabase
            .from('task_note_links')
            .insert(links);
        }
      }

      toast({
        title: "Tarea actualizada",
        description: `"${updatedTask.title}" se actualizó correctamente`,
      });
    } catch (error) {
      logger.error('Error updating task', error, 'Dashboard');
      toast({
        title: "Error",
        description: "Error inesperado al actualizar la tarea",
        variant: "destructive"
      });
    }
  }, [updateTaskOptimistic]);

  // Optimized task creation
  const handleSaveNewTask = useCallback(async (newTask: Task) => {
    setTaskDialogOpen(false);
    
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.title,
          description: newTask.description ?? null,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.dueDate ?? null,
          project_id: newTask.projectId ?? null,
        })
        .select("*")
        .single();
      
      if (error) {
        logger.error('Error creating task', error, 'Dashboard');
        toast({
          title: "Error",
          description: "No se pudo crear la tarea",
          variant: "destructive"
        });
        return;
      }

      // Add note links if any
      if (newTask.linkedNoteIds && newTask.linkedNoteIds.length > 0) {
        const links = newTask.linkedNoteIds.map(noteId => ({
          task_id: data.id,
          note_id: noteId
        }));
        
        await supabase
          .from('task_note_links')
          .insert(links);
      }

      // Optimistic update happens via real-time subscription
      toast({
        title: "Tarea creada",
        description: `"${newTask.title}" se creó correctamente`,
      });
    } catch (error) {
      logger.error('Error creating task', error, 'Dashboard');
      toast({
        title: "Error",
        description: "Error inesperado al crear la tarea",
        variant: "destructive"
      });
    }
  }, []);

  // Nueva función para actualizar notas
  const handleUpdateNote = useCallback((updatedNote: Note) => {
    updateNoteOptimistic(updatedNote.id, updatedNote);
    toast({
      title: "Nota actualizada",
      description: `La nota "${updatedNote.title}" ha sido actualizada correctamente.`,
    });
  }, [updateNoteOptimistic]);

  // Función para quitar la fecha de una tarea (actualiza en Supabase)
  const removeDueDate = useCallback(async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Evitar que se abra el diálogo de tarea

    // Encontrar la tarea para mostrar su título en la notificación
    const taskToUpdate = tasks.find((task) => task.id === taskId);
    if (!taskToUpdate) return;

    // Optimistic update
    updateTaskOptimistic(taskId, { dueDate: undefined });

    // Actualizar la fecha en la base de datos
    const { error: removeError } = await supabase
      .from('tasks')
      .update({ due_date: null })
      .eq('id', taskId);
    
    if (removeError) {
      logger.error('Error removing due date', removeError, 'Dashboard');
      // Revert optimistic update
      updateTaskOptimistic(taskId, { dueDate: taskToUpdate.dueDate });
      toast({ title: 'Error', description: 'No se pudo quitar la fecha de la tarea.' });
      return;
    }

    // Mostrar notificación con opción para deshacer
    toast({
      title: "Fecha eliminada",
      description: `Se ha quitado la fecha de la tarea "${taskToUpdate.title}"`,
      action: (
        <ToastAction
          altText="Deshacer"
          onClick={async () => {
            // Restore previous date
            updateTaskOptimistic(taskId, { dueDate: taskToUpdate.dueDate });
            
            // Update in database
            await supabase
              .from('tasks')
              .update({ due_date: taskToUpdate.dueDate })
              .eq('id', taskId);
          }}
        >
          Deshacer
        </ToastAction>
      ),
    });
  }, [tasks, updateTaskOptimistic]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    // Parse date string as local date (avoid timezone shift)
    const date = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Si es hoy
    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    }

    // Si es mañana
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    }

    // Otro día
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6" data-oid="agnad0s">
      <div className="space-y-2" data-oid="fy69c7u">
        <h1 className="text-2xl font-bold" data-oid="57nt3-f">
          {formatDate(selectedDate) ?? selectedDate}
        </h1>
        <div className="flex items-center gap-4" data-oid="-w4p0pr">
          <Progress
            value={loadingTasks ? 0 : (progressPercentage || 0)}
            className="h-2 flex-1"
            data-oid="q0bqs4w"
          />

          <span className="text-sm text-muted-foreground" data-oid="dgh123w">
            {loadingTasks ? (
              <Skeleton className="h-4 w-12 inline-block" />
            ) : (
              `${progressPercentage || 0}% completado`
            )}
          </span>
        </div>
      </div>

      {loadingTasks ? (
        <Skeleton className="h-40 w-full" data-oid="n5qqcf_" />
      ) : (
        <WeeklyCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasks={tasks}
          data-oid="n5qqcf_"
        />
      )}

      <div
        className="flex justify-between items-center mb-2"
        data-oid="-984mi."
      >
        <h2 className="text-lg font-medium" data-oid="1:7_1ei">
          Tareas
        </h2>
        <Button size="sm" onClick={handleCreateTask} data-oid="xsfheb9">
          <Plus className="h-4 w-4 mr-1" data-oid="d7sg6tm" /> Nueva Tarea
        </Button>
      </div>

      {loadingTasks ? (
        <SkeletonLoader type="list" count={4} className="grid grid-cols-1 md:grid-cols-2 gap-4" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="c8:051v">
        <div
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "pending")}
          data-oid="8wh6.w2"
        >
          <h2 className="text-lg font-medium mb-3" data-oid="vhveh8l">
            Pendiente
          </h2>
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="task-card cursor-pointer group"
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onClick={() => handleTaskClick(task)}
              data-oid="ab97gy6"
            >
              <div
                className="flex justify-between items-start"
                data-oid="zmp_j_k"
              >
                <div data-oid="ottlvot">
                  <p className="font-medium" data-oid="4fak8l-">
                    {task.title}
                  </p>
                  {/* Etiqueta de proyecto relacionado */}
                  {task.projectId && loadingProjects && (
                    <Skeleton className="h-5 w-16 mb-1" />
                  )}
                  {task.projectId && !loadingProjects && (() => {
                    const prj = projects.find((p) => p.id === task.projectId);
                    if (!prj) return null;
                    return (
                      <Badge
                        className="text-xs mb-1"
                        style={{
                          backgroundColor: prj.color,
                          borderColor: prj.color,
                          color: '#fff',
                        }}
                      >
                        {prj.name}
                      </Badge>
                    );
                  })()}
                  <div
                    className="flex items-center gap-2 mt-1"
                    data-oid="jq0r54j"
                  >
                    {task.dueDate && (
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        data-oid="_mk:alc"
                      >
                        <Calendar className="h-3 w-3" data-oid="ras86bd" />
                        <span data-oid="uh4e.2s">
                          {formatDate(task.dueDate)}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          onClick={(e) => removeDueDate(e, task.id)}
                          title="Quitar fecha"
                          data-oid="l.9x9zz"
                        >
                          <CalendarOff
                            className="h-3 w-3 text-muted-foreground hover:text-white"
                            data-oid="-zenida"
                          />
                        </button>
                      </div>
                    )}
                    {task.linkedNoteIds && task.linkedNoteIds.length > 0 && (
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        data-oid="5mzlggg"
                      >
                        <Calendar className="h-3 w-3" data-oid="zchh28_" />
                        <span data-oid="7339hok">
                          {task.linkedNoteIds.length} notas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    task.priority === "high"
                      ? "bg-destructive"
                      : task.priority === "medium"
                        ? "bg-white"
                        : "bg-muted-foreground"
                  }`}
                  data-oid="eduw3j8"
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "done")}
          data-oid="uejpolc"
        >
          <h2 className="text-lg font-medium mb-3" data-oid="-sxeg7q">
            Hecho
          </h2>
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="task-card cursor-pointer group"
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onClick={() => handleTaskClick(task)}
              data-oid="xvs7num"
            >
              <div
                className="flex justify-between items-start"
                data-oid="9opy5jd"
              >
                <div data-oid="fqip17o">
                  <p className="font-medium" data-oid="h6ew:zf">
                    {task.title}
                  </p>
                  {/* Etiqueta de proyecto relacionado */}
                  {task.projectId && loadingProjects && (
                    <Skeleton className="h-5 w-16 mb-1" />
                  )}
                  {task.projectId && !loadingProjects && (() => {
                    const prj = projects.find((p) => p.id === task.projectId);
                    if (!prj) return null;
                    return (
                      <Badge
                        className="text-xs mb-1"
                        style={{
                          backgroundColor: prj.color,
                          borderColor: prj.color,
                          color: '#fff',
                        }}
                      >
                        {prj.name}
                      </Badge>
                    );
                  })()}
                  <div
                    className="flex items-center gap-2 mt-1"
                    data-oid="ngg:l90"
                  >
                    {task.dueDate && (
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        data-oid="9y8e.q1"
                      >
                        <Calendar className="h-3 w-3" data-oid="357u6sk" />
                        <span data-oid="v1wjj8w">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}
                    {task.linkedNoteIds && task.linkedNoteIds.length > 0 && (
                      <div
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        data-oid="ozx8ahs"
                      >
                        <Calendar className="h-3 w-3" data-oid="t_g76ii" />
                        <span data-oid="dr0f.zu">
                          {task.linkedNoteIds.length} notas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    task.priority === "high"
                      ? "bg-destructive"
                      : task.priority === "medium"
                        ? "bg-white"
                        : "bg-muted-foreground"
                  }`}
                  data-oid="dh9hbci"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onUpdate={handleUpdateTask}
          onSaveNew={handleSaveNewTask}
          isNew={isNewTask}
          projectNotes={notes}
          projects={projects}
          onUpdateNote={handleUpdateNote}
          data-oid="qmqhf28"
        />
      )}
    </div>
  );
}