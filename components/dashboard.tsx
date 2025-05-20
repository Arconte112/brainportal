"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSelectedDate } from "@/hooks/use-selected-date";
import { supabase } from "@/lib/supabaseClient";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyCalendar } from "./weekly-calendar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CalendarOff } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export type Task = {
  id: string;
  title: string;
  status: "pending" | "done";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  description?: string;
  projectId?: string;
  linkedNoteIds?: string[]; // Array de IDs de notas relacionadas
};

// Tipo para las notas
export type Note = {
  id: string;
  title: string;
  content: string;
  projectId: string;
  date: string;
};
// Cache for static project list
let projectsCache: { id: string; name: string; color?: string }[] | null = null;

// Notas cargadas desde la base de datos

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  useEffect(() => {
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const { data, error } = await supabase
          .from<{
            id: string;
            title: string;
            description: string | null;
            status: "pending" | "done";
            priority: "high" | "medium" | "low";
            due_date: string | null;
            project_id: string | null;
          }>("tasks")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) {
          console.error("Error loading tasks:", error);
        } else if (data) {
          setTasks(
            data.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              dueDate: t.due_date ?? undefined,
              description: t.description ?? undefined,
              projectId: t.project_id ?? undefined,
              linkedNoteIds: [],
            })),
          );
        }
      } finally {
        setLoadingTasks(false);
      }
    };
    loadTasks();
  }, []);
  // Cargar lista de proyectos para etiquetas
  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      if (projectsCache) {
        setProjects(projectsCache);
        setLoadingProjects(false);
        return;
      }
      const { data, error } = await supabase
        .from<{ id: string; name: string; color?: string }>('projects')
        .select('id,name,color');
      if (error) {
        console.error('Error loading projects:', error);
      } else {
        const prjData = data ?? [];
        setProjects(prjData);
        projectsCache = prjData;
      }
      setLoadingProjects(false);
    };
    loadProjects();
  }, []);
  // Cargar notas reales desde la base de datos
  useEffect(() => {
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from<{
          id: string;
          title: string;
          content: string | null;
          project_id: string | null;
          date: string;
        }>('notes')
        .select('id,title,content,project_id,date');
      if (error) console.error('Error loading notes:', error);
      else
        setNotes(
          (data ?? []).map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content ?? undefined,
            projectId: n.project_id ?? undefined,
            date: n.date,
          })),
        );
    };
    loadNotes();
  }, []);

  const [notes, setNotes] = useState<Note[]>([]);
  // Día seleccionado en el calendario semanal (YYYY-MM-DD)
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  // Filtrar tareas por día seleccionado
  const pendingTasks = tasks.filter(
    (task) => task.status === 'pending' && task.dueDate === selectedDate
  );
  const completedTasks = tasks.filter(
    (task) => task.status === 'done' && task.dueDate === selectedDate
  );

  const progressPercentage = Math.round(
    (completedTasks.length / tasks.length) * 100,
  );

  // Obtener la siguiente acción prioritaria
  const getNextAction = () => {
    // Ordenar tareas pendientes por prioridad y fecha de vencimiento
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
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
  };

  const nextAction = getNextAction();

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: "pending" | "done") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: targetStatus } : task,
      ),
    );
  };

  const markTaskDone = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: "done" } : task,
      ),
    );
  };

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

  // Actualiza tarea existente en Supabase y estado local
  const handleUpdateTask = async (updatedTask: Task) => {
    const { data, error } = await supabase
      .from<{
        id: string;
        title: string;
        description: string | null;
        status: "pending" | "done";
        priority: "high" | "medium" | "low";
        due_date: string | null;
        project_id: string | null;
      }>("tasks")
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
      console.error("Error updating task:", error);
    } else if (data) {
      setTasks(
        tasks.map((task) =>
          task.id === data.id
            ? {
                id: data.id,
                title: data.title,
                status: data.status,
                priority: data.priority,
                dueDate: data.due_date ?? undefined,
                description: data.description ?? undefined,
                projectId: data.project_id ?? undefined,
                linkedNoteIds: updatedTask.linkedNoteIds,
              }
            : task,
        ),
      );
    }
    setTaskDialogOpen(false);
  };

  // Crea nueva tarea en Supabase y agrega al estado local
  const handleSaveNewTask = async (newTask: Task) => {
    const { data, error } = await supabase
      .from<{
        id: string;
        title: string;
        description: string | null;
        status: "pending" | "done";
        priority: "high" | "medium" | "low";
        due_date: string | null;
        project_id: string | null;
      }>("tasks")
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
      console.error("Error creating task:", error);
    } else if (data) {
      setTasks([
        ...tasks,
        {
          id: data.id,
          title: data.title,
          status: data.status,
          priority: data.priority,
          dueDate: data.due_date ?? undefined,
          description: data.description ?? undefined,
          projectId: data.project_id ?? undefined,
          linkedNoteIds: [],
        },
      ]);
    }
    setTaskDialogOpen(false);
  };

  // Nueva función para actualizar notas
  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(
      notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
    );
    toast({
      title: "Nota actualizada",
      description: `La nota "${updatedNote.title}" ha sido actualizada correctamente.`,
    });
  };

  // Función para quitar la fecha de una tarea (actualiza en Supabase)
  const removeDueDate = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Evitar que se abra el diálogo de tarea

    // Encontrar la tarea para mostrar su título en la notificación
    const taskToUpdate = tasks.find((task) => task.id === taskId);

    // Actualizar la fecha en la base de datos
    const { error: removeError } = await supabase
      .from('tasks')
      .update({ due_date: null })
      .eq('id', taskId);
    if (removeError) {
      console.error('Error removing due date:', removeError);
      toast({ title: 'Error', description: 'No se pudo quitar la fecha de la tarea.' });
      return;
    }
    // Actualizar estado local
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, dueDate: undefined } : task,
      ),
    );

    // Mostrar notificación con opción para deshacer
    if (taskToUpdate) {
      toast({
        title: "Fecha eliminada",
        description: `Se ha quitado la fecha de la tarea "${taskToUpdate.title}"`,
        action: (
          <ToastAction
            altText="Deshacer"
            onClick={() => {
              setTasks(
                tasks.map((task) =>
                  task.id === taskId
                    ? { ...task } // Mantener la tarea original
                    : task,
                ),
              );
            }}
            data-oid="jtvdw2d"
          >
            Deshacer
          </ToastAction>
        ),
      });
    }
  };

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
          {loadingTasks ? (
            <Skeleton className="h-2 flex-1" />
          ) : (
            <Progress
              value={progressPercentage}
              className="h-2 flex-1"
              data-oid="q0bqs4w"
            />
          )}

          {loadingTasks ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            <span className="text-sm text-muted-foreground" data-oid="dgh123w">
              {progressPercentage}% completado
            </span>
          )}
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

      {loadingTasks && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="c8:051v">
          {[ 'Pendiente', 'Hecho' ].map((title) => (
            <div key={title} className="kanban-column">
              <h2 className="text-lg font-medium mb-3">{title}</h2>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 mb-2" />
              ))}
            </div>
          ))}
        </div>
      )}
      {!loadingTasks && (
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
                  {(() => {
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
                  {(() => {
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
