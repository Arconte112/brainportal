"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  CheckSquare,
  FileText,
  Calendar,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { NoteDialog } from "./note-dialog";
import { TaskDialog } from "./task-dialog";
import { Badge } from "@/components/ui/badge";
import type { Task, Note } from "./dashboard";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Tipos de datos
type Project = {
  id: string;
  name: string;
  description?: string;
  color?: string; // Color personalizado para la etiqueta
};

// Datos de ejemplo
export const PROJECTS: Project[] = [
  {
    id: "1",
    name: "Rediseño Web",
    description: "Proyecto de rediseño del sitio web corporativo",
    color: "#6366F1",
  },
  {
    id: "2",
    name: "Campaña Marketing",
    description: "Campaña de marketing digital para el Q2",
    color: "#10B981",
  },
  {
    id: "3",
    name: "Desarrollo App",
    description: "Desarrollo de aplicación móvil para clientes",
    color: "#F59E0B",
  },
  {
    id: "4",
    name: "Investigación UX",
    description:
      "Investigación de experiencia de usuario para nuevos productos",
    color: "#EF4444",
  },
];

const TASKS: Task[] = [
  {
    id: "101",
    title: "Diseñar página de inicio",
    status: "done",
    projectId: "1",
    priority: "high",
    dueDate: "2025-05-10",
    description:
      "Crear diseño de la página de inicio según los nuevos lineamientos de marca.",
    linkedNoteIds: ["1001"], // Ejemplo de tarea con una nota relacionada
  },
  {
    id: "102",
    title: "Implementar responsive design",
    status: "pending",
    projectId: "1",
    priority: "medium",
    dueDate: "2025-05-18",
    description:
      "Asegurar que el diseño se adapte correctamente a todos los dispositivos.",
    linkedNoteIds: ["1001", "1002"], // Ejemplo de tarea con múltiples notas relacionadas
  },
  {
    id: "103",
    title: "Optimizar imágenes",
    status: "pending",
    projectId: "1",
    priority: "low",
    dueDate: "2025-05-20",
    description:
      "Comprimir y optimizar todas las imágenes del sitio para mejorar el rendimiento.",
  },
  {
    id: "104",
    title: "Revisar accesibilidad",
    status: "pending",
    projectId: "1",
    priority: "medium",
    dueDate: "2025-05-22",
    description:
      "Verificar que el sitio cumpla con los estándares de accesibilidad WCAG.",
  },
  {
    id: "105",
    title: "Pruebas de rendimiento",
    status: "done",
    projectId: "1",
    priority: "high",
    dueDate: "2025-05-12",
    description:
      "Realizar pruebas de velocidad y optimizar el tiempo de carga.",
  },

  {
    id: "201",
    title: "Definir audiencia objetivo",
    status: "done",
    projectId: "2",
    priority: "high",
    dueDate: "2025-05-05",
    description:
      "Identificar y definir los segmentos de audiencia para la campaña.",
    linkedNoteIds: ["2001"],
  },
  {
    id: "202",
    title: "Crear contenido para redes",
    status: "pending",
    projectId: "2",
    priority: "medium",
    dueDate: "2025-05-19",
    description: "Desarrollar contenido para Facebook, Instagram y LinkedIn.",
  },
  {
    id: "203",
    title: "Configurar anuncios",
    status: "pending",
    projectId: "2",
    priority: "high",
    dueDate: "2025-05-21",
    description: "Configurar campañas de anuncios en Google Ads y Meta.",
  },

  {
    id: "301",
    title: "Diseñar wireframes",
    status: "done",
    projectId: "3",
    priority: "high",
    dueDate: "2025-05-02",
    description:
      "Crear wireframes para todas las pantallas principales de la app.",
    linkedNoteIds: ["3001"],
  },
  {
    id: "302",
    title: "Implementar autenticación",
    status: "done",
    projectId: "3",
    priority: "high",
    dueDate: "2025-05-08",
    description:
      "Desarrollar sistema de autenticación con soporte para redes sociales.",
  },
  {
    id: "303",
    title: "Desarrollar API",
    status: "pending",
    projectId: "3",
    priority: "medium",
    dueDate: "2025-05-25",
    description:
      "Crear endpoints de API para todas las funcionalidades principales.",
  },
  {
    id: "304",
    title: "Pruebas de integración",
    status: "pending",
    projectId: "3",
    priority: "medium",
    dueDate: "2025-05-28",
    description: "Realizar pruebas de integración entre frontend y backend.",
  },

  {
    id: "401",
    title: "Entrevistas con usuarios",
    status: "done",
    projectId: "4",
    priority: "high",
    dueDate: "2025-05-07",
    description:
      "Realizar entrevistas con usuarios para identificar necesidades.",
    linkedNoteIds: ["4001"],
  },
  {
    id: "402",
    title: "Análisis de competencia",
    status: "done",
    projectId: "4",
    priority: "medium",
    dueDate: "2025-05-09",
    description:
      "Analizar soluciones de la competencia y identificar oportunidades.",
  },
  {
    id: "403",
    title: "Crear prototipos",
    status: "pending",
    projectId: "4",
    priority: "high",
    dueDate: "2025-05-23",
    description:
      "Desarrollar prototipos interactivos para pruebas con usuarios.",
  },
];

const NOTES: Note[] = [
  {
    id: "1001",
    title: "Reunión inicial",
    content:
      "Notas de la reunión inicial con el equipo de diseño. Definimos los objetivos principales del rediseño.\n\n- Simplificar la navegación\n- Mejorar la experiencia móvil\n- Actualizar la paleta de colores\n- Reducir el tiempo de carga\n\nPróximos pasos: Crear wireframes para las páginas principales y compartir con el equipo para feedback inicial.",
    projectId: "1",
    date: "2025-04-10",
  },
  {
    id: "1002",
    title: "Feedback del cliente",
    content:
      "El cliente prefiere un enfoque más minimalista. Debemos reducir elementos visuales en la página principal.\n\nPuntos clave:\n1. Menos imágenes, más espacio en blanco\n2. Tipografía más grande y clara\n3. Eliminar animaciones innecesarias\n4. Enfocarse en el contenido principal\n\nEl cliente mencionó específicamente que quiere que la página de inicio comunique el valor de la empresa en los primeros 5 segundos.",
    projectId: "1",
    date: "2025-04-15",
  },
  {
    id: "2001",
    title: "Estrategia de contenido",
    content:
      "Enfocarnos en contenido educativo para posicionarnos como expertos en el sector.\n\nTipos de contenido a desarrollar:\n- Artículos de blog (2 por semana)\n- Infografías mensuales\n- Webinars trimestrales\n- Casos de estudio (1 por mes)\n\nTemas principales: innovación, sostenibilidad, tendencias de la industria, mejores prácticas.",
    projectId: "2",
    date: "2025-04-12",
  },
  {
    id: "3001",
    title: "Arquitectura de la app",
    content:
      "Decidimos usar React Native para el frontend y Node.js para el backend. La base de datos será MongoDB.\n\nEstructura de carpetas:\n/src\n  /components\n  /screens\n  /navigation\n  /services\n  /utils\n  /hooks\n  /assets\n\nFlujo de autenticación:\n1. Pantalla de bienvenida\n2. Registro/Login\n3. Verificación (opcional)\n4. Onboarding\n5. Dashboard principal",
    projectId: "3",
    date: "2025-04-05",
  },
  {
    id: "4001",
    title: "Hallazgos de investigación",
    content:
      "Los usuarios encuentran confuso el proceso de checkout. Necesitamos simplificarlo y reducir los pasos.\n\nProblemas identificados:\n- Demasiados campos obligatorios\n- Falta de indicadores de progreso\n- Errores de validación poco claros\n- Proceso de pago complicado\n\nRecomendaciones:\n1. Reducir a máximo 3 pasos\n2. Implementar autocompletado\n3. Añadir barra de progreso\n4. Mejorar mensajes de error\n5. Ofrecer opciones de pago simplificadas",
    projectId: "4",
    date: "2025-04-18",
  },
];

export function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Cargar lista de proyectos reales para asignar tareas
  useEffect(() => {
    const loadProjects = async () => {
      const { data: prjs, error: prjErr } = await supabase
        .from<Project>('projects')
        .select('id,name,description,color');
      if (prjErr) console.error('Error fetching projects list:', prjErr);
      else setAllProjects(prjs ?? []);
    };
    loadProjects();
  }, []);
  const [activeTab, setActiveTab] = useState("tasks");

  // Estado para el diálogo de notas
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Estado para el diálogo de tareas
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);

  // Cargar proyecto, tareas y notas desde Supabase
  const fetchProjectData = async () => {
    // Proyecto
    const { data: proj, error: projErr } = await supabase
      .from<Project>('projects')
      .select('id,name,description,color')
      .eq('id', projectId)
      .single();
    if (projErr) {
      console.error('Error fetching project:', projErr);
      return;
    }
    setProject(proj);
    // Tareas
    const { data: tks, error: tksErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);
    if (tksErr) {
      console.error('Error fetching tasks:', tksErr);
    } else {
      setTasks(
        tks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          projectId: t.project_id,
          dueDate: t.due_date || undefined,
          description: t.description || undefined,
          linkedNoteIds: [],
        })),
      );
    }
    // Notas
    const { data: nts, error: ntsErr } = await supabase
      .from('notes')
      .select('*')
      .eq('project_id', projectId);
    if (ntsErr) {
      console.error('Error fetching notes:', ntsErr);
    } else {
      setNotes(
        nts.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          projectId: n.project_id,
          date: n.date,
        })),
      );
    }
  };
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  if (!project) {
    return <div data-oid="_j407_6">Cargando...</div>;
  }

  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const completedTasks = tasks.filter((task) => task.status === "done");
  const progressPercentage =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

  // Funciones para manejar tareas
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

  const assignTodayDate = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Evitar que se abra el diálogo de tarea

    const today = new Date().toISOString().split("T")[0];
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, dueDate: today } : task,
      ),
    );

    // Mostrar notificación
    const taskTitle = tasks.find((t) => t.id === taskId)?.title;
    toast({
      title: "Fecha asignada",
      description: `La tarea "${taskTitle}" ha sido programada para hoy`,
    });
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
      projectId: projectId,
      dueDate: new Date().toISOString().split("T")[0],
      description: "",
      linkedNoteIds: [],
    };
    setSelectedTask(newTask);
    setIsNewTask(true);
    setTaskDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description || null,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate || null,
        project_id: updatedTask.projectId,
      })
      .eq('id', updatedTask.id);
    if (error) console.error('Error updating task:', error);
    setTaskDialogOpen(false);
    fetchProjectData();
  };

  const handleSaveNewTask = async (newTask: Task) => {
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status,
        priority: newTask.priority,
        due_date: newTask.dueDate || null,
        project_id: newTask.projectId,
      });
    if (error) console.error('Error creating task:', error);
    setTaskDialogOpen(false);
    fetchProjectData();
  };

  // Funciones para manejar notas
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setNoteDialogOpen(true);
  };

  const handleNoteUpdate = async (updatedNote: Note) => {
    const { error } = await supabase
      .from('notes')
      .update({
        title: updatedNote.title,
        content: updatedNote.content,
        date: updatedNote.date,
        project_id: updatedNote.projectId,
      })
      .eq('id', updatedNote.id);
    if (error) console.error('Error updating note:', error);
    toast({
      title: "Nota actualizada",
      description: `La nota "${updatedNote.title}" ha sido actualizada correctamente.`,
    });
    setNoteDialogOpen(false);
    fetchProjectData();
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Nueva nota",
      content: "",
      projectId: projectId,
      date: new Date().toISOString().split("T")[0],
    };
    setSelectedNote(newNote);
    setNoteDialogOpen(true);
  };

  const handleSaveNewNote = async (newNote: Note) => {
    const { error } = await supabase
      .from('notes')
      .insert({
        title: newNote.title,
        content: newNote.content,
        date: newNote.date,
        project_id: newNote.projectId,
      });
    if (error) console.error('Error creating note:', error);
    setNoteDialogOpen(false);
    fetchProjectData();
  };

  // Función para formatear fechas
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
    <div className="space-y-6" data-oid="3mpy0nn">
      <div className="flex items-center gap-4" data-oid="ltvpc76">
        <Link href="/projects" data-oid="5m55aai">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-oid="8oixjif"
          >
            <ArrowLeft className="h-4 w-4" data-oid="03j7jg7" />
            <span className="sr-only" data-oid="q5s8y_3">
              Volver
            </span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold" data-oid="fzr9ypj">
          {project.name}
        </h1>
      </div>

      {project.description && (
        <p className="text-muted-foreground" data-oid="-7cjb.m">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-4" data-oid="51oyhog">
        <Progress
          value={progressPercentage}
          className="h-2 flex-1"
          data-oid="4t__b5i"
        />

        <span className="text-sm text-muted-foreground" data-oid="6pg8kny">
          {progressPercentage}% completado
        </span>
      </div>

      <Tabs
        defaultValue="tasks"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        data-oid="9zn0y5c"
      >
        <TabsList className="grid grid-cols-2 mb-4" data-oid="489utq.">
          <TabsTrigger
            value="tasks"
            className="flex items-center gap-1"
            data-oid="sa-qllv"
          >
            <CheckSquare className="h-4 w-4 mr-1" data-oid="1uqxlpn" />
            <span data-oid="vl4411b">Tareas ({tasks.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex items-center gap-1"
            data-oid="hkrq249"
          >
            <FileText className="h-4 w-4 mr-1" data-oid="4h.4f6-" />
            <span data-oid="iy_zqs.">Notas ({notes.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4" data-oid="ht5i_:0">
          <div className="flex justify-end" data-oid="oldn7d0">
            <Button size="sm" onClick={handleCreateTask} data-oid="qzp3e0i">
              <Plus className="h-4 w-4 mr-1" data-oid="pf.a4zk" /> Nueva Tarea
            </Button>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-oid="q5-7a8q"
          >
            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "pending")}
              data-oid="y0eadn9"
            >
              <h2 className="text-lg font-medium mb-3" data-oid="c-940j:">
                Pendiente ({pendingTasks.length})
              </h2>
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card cursor-pointer group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => handleTaskClick(task)}
                  data-oid="m76yu:_"
                >
                  <div
                    className="flex justify-between items-start"
                    data-oid="o8myzrs"
                  >
                    <div data-oid="hug3950">
                      <p className="font-medium" data-oid="jwa9khb">
                        {task.title}
                      </p>
                      {/* Etiqueta de proyecto relacionado */}
                      {(() => {
                        const prj = PROJECTS.find((p) => p.id === task.projectId);
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
                        data-oid="gfjsgvk"
                      >
                        {task.dueDate && (
                          <div
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                            data-oid="bsc1.cz"
                          >
                            <Calendar className="h-3 w-3" data-oid="avftwb_" />
                            <span data-oid="t701yu5">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                        {task.linkedNoteIds &&
                          task.linkedNoteIds.length > 0 && (
                            <div
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                              data-oid="28bw3xw"
                            >
                              <FileText
                                className="h-3 w-3"
                                data-oid="vf5d:ri"
                              />

                              <span data-oid="5hnfn0-">
                                {task.linkedNoteIds.length} notas
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" data-oid="7rkykjv">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.priority === "high"
                            ? "bg-destructive"
                            : task.priority === "medium"
                              ? "bg-white"
                              : "bg-muted-foreground"
                        }`}
                        data-oid="_n7sh-0"
                      />

                      {(!task.dueDate ||
                        new Date(task.dueDate).toDateString() !==
                          new Date().toDateString()) && (
                        <button
                          onClick={(e) => assignTodayDate(e, task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Asignar para hoy"
                          data-oid="kdekp8e"
                        >
                          <CalendarCheck
                            className="h-4 w-4 text-muted-foreground hover:text-white"
                            data-oid="p3y9w-x"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div
                  className="text-sm text-muted-foreground p-2"
                  data-oid="_c5ug-o"
                >
                  No hay tareas pendientes
                </div>
              )}
            </div>

            <div
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "done")}
              data-oid=".9hn8i-"
            >
              <h2 className="text-lg font-medium mb-3" data-oid="hiz0ipt">
                Hecho ({completedTasks.length})
              </h2>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card cursor-pointer group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => handleTaskClick(task)}
                  data-oid="fxecei6"
                >
                  <div
                    className="flex justify-between items-start"
                    data-oid="rgdy8lm"
                  >
                    <div data-oid=".hj.d4-">
                      <p className="font-medium" data-oid="29ffemo">
                        {task.title}
                      </p>
                      {/* Etiqueta de proyecto relacionado */}
                      {(() => {
                        const prj = PROJECTS.find((p) => p.id === task.projectId);
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
                        data-oid="a7rnstb"
                      >
                        {task.dueDate && (
                          <div
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                            data-oid="1vih4ow"
                          >
                            <Calendar className="h-3 w-3" data-oid="_fkmy2d" />
                            <span data-oid="98r0hte">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                        {task.linkedNoteIds &&
                          task.linkedNoteIds.length > 0 && (
                            <div
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                              data-oid="f10s.pq"
                            >
                              <FileText
                                className="h-3 w-3"
                                data-oid="8_kp6ki"
                              />

                              <span data-oid="e:5ppnr">
                                {task.linkedNoteIds.length} notas
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" data-oid="4eu6bor">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          task.priority === "high"
                            ? "bg-destructive"
                            : task.priority === "medium"
                              ? "bg-white"
                              : "bg-muted-foreground"
                        }`}
                        data-oid="0wlaw88"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div
                  className="text-sm text-muted-foreground p-2"
                  data-oid="4s6x07f"
                >
                  No hay tareas completadas
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4" data-oid="wr42sn:">
          <div className="flex justify-end" data-oid="zg1:kyp">
            <Button size="sm" onClick={handleCreateNote} data-oid="t-tl_gj">
              <Plus className="h-4 w-4 mr-1" data-oid="aghok1o" /> Nueva Nota
            </Button>
          </div>

          {notes.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              data-oid="dnaujxs"
            >
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-card p-4 rounded-md border border-border hover:bg-card/80 transition-colors cursor-pointer h-[150px] flex flex-col"
                  onClick={() => handleNoteClick(note)}
                  data-oid="s5p2sa."
                >
                  <div
                    className="flex justify-between items-start mb-2"
                    data-oid="wttqukq"
                  >
                    <h3 className="font-medium truncate" data-oid="ek..j_v">
                      {note.title}
                    </h3>
                    <span
                      className="text-xs text-muted-foreground whitespace-nowrap ml-2"
                      data-oid="_orz7g8"
                    >
                      {note.date}
                    </span>
                  </div>
                  <p
                    className="text-sm text-muted-foreground line-clamp-4 flex-grow overflow-hidden"
                    data-oid="ybafoz:"
                  >
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" data-oid="71rds2f">
              <p className="text-muted-foreground" data-oid="yl.sae:">
                No hay notas para este proyecto
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de notas */}
      {selectedNote && (
        <NoteDialog
          note={selectedNote}
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          onUpdate={handleNoteUpdate}
          onSaveNew={handleSaveNewNote}
          isNew={!notes.some((n) => n.id === selectedNote.id)}
          data-oid="e2o5.gh"
        />
      )}

      {/* Diálogo de tareas */}
      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onUpdate={handleUpdateTask}
          onSaveNew={handleSaveNewTask}
          isNew={isNewTask}
          projectNotes={notes}
          onUpdateNote={handleNoteUpdate}
          projects={allProjects}
          data-oid="0:0ek23"
        />
      )}
    </div>
  );
}
