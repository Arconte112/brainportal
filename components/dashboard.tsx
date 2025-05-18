"use client";

import type React from "react";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { WeeklyCalendar } from "./weekly-calendar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CalendarOff } from "lucide-react";
import { TaskDialog } from "./task-dialog";
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

// Datos de ejemplo para notas
const SAMPLE_NOTES: Note[] = [
  {
    id: "dashboard-note-1",
    title: "Ideas para mejorar productividad",
    content:
      "- Usar la técnica Pomodoro\n- Establecer prioridades claras\n- Eliminar distracciones\n- Agrupar tareas similares",
    projectId: "personal",
    date: "2025-05-10",
  },
  {
    id: "dashboard-note-2",
    title: "Recursos útiles",
    content:
      "Enlaces a herramientas y recursos que pueden ser útiles para diferentes proyectos:\n\n- Figma para diseño\n- Notion para documentación\n- GitHub para control de versiones\n- Slack para comunicación",
    projectId: "personal",
    date: "2025-05-12",
  },
];

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Revisar propuesta de diseño",
      status: "pending",
      priority: "high",
      dueDate: "2025-05-15",
      description:
        "Revisar la última versión de la propuesta de diseño y enviar feedback al equipo.",
      linkedNoteIds: ["dashboard-note-1"],
    },
    {
      id: "2",
      title: "Preparar presentación para cliente",
      status: "pending",
      priority: "medium",
      dueDate: "2025-05-16",
      description:
        "Crear slides para la presentación del nuevo proyecto al cliente.",
      linkedNoteIds: ["dashboard-note-1", "dashboard-note-2"],
    },
    {
      id: "3",
      title: "Actualizar documentación",
      status: "pending",
      priority: "low",
      dueDate: "2025-05-18",
      description:
        "Actualizar la documentación técnica con los últimos cambios.",
    },
    {
      id: "4",
      title: "Enviar correo a equipo",
      status: "done",
      priority: "medium",
      dueDate: "2025-05-14",
      description: "Enviar correo con resumen de la reunión semanal.",
    },
    {
      id: "5",
      title: "Revisar métricas semanales",
      status: "done",
      priority: "low",
      dueDate: "2025-05-13",
      description:
        "Analizar las métricas de rendimiento de la semana anterior.",
    },
  ]);

  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const completedTasks = tasks.filter((task) => task.status === "done");

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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setTaskDialogOpen(false);
  };

  const handleSaveNewTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
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

  // Nueva función para quitar la fecha de una tarea
  const removeDueDate = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Evitar que se abra el diálogo de tarea

    // Encontrar la tarea para mostrar su título en la notificación
    const taskToUpdate = tasks.find((task) => task.id === taskId);

    // Actualizar la tarea para quitar la fecha
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

    const date = new Date(dateString);
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
          Hoy
        </h1>
        <div className="flex items-center gap-4" data-oid="-w4p0pr">
          <Progress
            value={progressPercentage}
            className="h-2 flex-1"
            data-oid="q0bqs4w"
          />

          <span className="text-sm text-muted-foreground" data-oid="dgh123w">
            {progressPercentage}% completado
          </span>
        </div>
      </div>

      <WeeklyCalendar data-oid="n5qqcf_" />

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

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onUpdate={handleUpdateTask}
          onSaveNew={handleSaveNewTask}
          isNew={isNewTask}
          projectNotes={notes}
          onUpdateNote={handleUpdateNote}
          data-oid="qmqhf28"
        />
      )}
    </div>
  );
}
