"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarCheck,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Tipos
type Project = {
  id: string;
  name: string;
  description?: string;
};

type Task = {
  id: string;
  title: string;
  status: "pending" | "done";
  priority: "high" | "medium" | "low";
  projectId: string;
  dueDate?: string;
  description?: string;
};

// Datos de ejemplo
const PROJECTS: Project[] = [
  {
    id: "1",
    name: "Rediseño Web",
    description: "Proyecto de rediseño del sitio web corporativo",
  },
  {
    id: "2",
    name: "Campaña Marketing",
    description: "Campaña de marketing digital para el Q2",
  },
  {
    id: "3",
    name: "Desarrollo App",
    description: "Desarrollo de aplicación móvil para clientes",
  },
  {
    id: "4",
    name: "Investigación UX",
    description:
      "Investigación de experiencia de usuario para nuevos productos",
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
  },
  {
    id: "103",
    title: "Optimizar imágenes",
    status: "pending",
    projectId: "1",
    priority: "low",
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
  },
  {
    id: "202",
    title: "Crear contenido para redes",
    status: "pending",
    projectId: "2",
    priority: "medium",
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
    description:
      "Desarrollar prototipos interactivos para pruebas con usuarios.",
  },
];

export function ProjectTasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar proyectos y tareas desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prjs, error: prjErr } = await supabase
        .from('projects')
        .select('id,name,description');
      if (prjErr) {
        console.error('Error fetching projects:', prjErr);
        setLoading(false);
        return;
      }
      const { data: tks, error: tksErr } = await supabase
        .from('tasks')
        .select('id,title,status,priority,due_date,description,project_id');
      if (tksErr) {
        console.error('Error fetching tasks:', tksErr);
        setLoading(false);
        return;
      }
      setProjects(prjs);
      const mapped = tks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.project_id,
        dueDate: t.due_date || undefined,
        description: t.description || undefined,
      }));
      setTasks(mapped);
      // Inicializar proyectos expandidos
      const initial: Record<string, boolean> = {};
      prjs.forEach((p) => {
        initial[p.id] = true;
      });
      setExpandedProjects(initial);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Función para asignar la fecha actual a una tarea
  const assignTodayDate = (taskId: string) => {
    const today = new Date().toISOString().split("T")[0];
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, dueDate: today };
        }
        return task;
      }),
    );

    // Mostrar notificación
    const taskTitle = tasks.find((t) => t.id === taskId)?.title;
    toast({
      title: "Fecha asignada",
      description: `La tarea "${taskTitle}" ha sido programada para hoy`,
    });
  };

  // Función para alternar la expansión de un proyecto
  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Filtrar tareas según el estado de showCompleted
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => task.status === "pending");

  // Agrupar tareas por proyecto
  const tasksByProject = projects
    .map((project) => ({
      ...project,
      tasks: filteredTasks.filter((task) => task.projectId === project.id),
    }))
    .filter((project) => project.tasks.length > 0);

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha";

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
    <div className="space-y-6" data-oid="hqahjyv">
      <div className="flex items-center justify-between" data-oid="hwy8ofh">
        <div className="flex items-center gap-4" data-oid="v_cs.2r">
          <Link href="/projects" data-oid="d9-ypk2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-oid="_49yy0i"
            >
              <ArrowLeft className="h-4 w-4" data-oid="h8:wjwu" />
              <span className="sr-only" data-oid="avv7cqa">
                Volver
              </span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-oid="pl05r8a">
            Tareas por Proyecto
          </h1>
        </div>
        <div className="flex items-center gap-2" data-oid="ky7:jq-">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs h-8"
            data-oid="jyr2s33"
          >
            {showCompleted ? "Ocultar completadas" : "Mostrar completadas"}
          </Button>
        </div>
      </div>

      <div className="space-y-6" data-oid=".:04x_g">
        {tasksByProject.length > 0 ? (
          tasksByProject.map((project) => (
            <Collapsible
              key={project.id}
              open={expandedProjects[project.id]}
              onOpenChange={() => toggleProjectExpansion(project.id)}
              className="border border-border rounded-md overflow-hidden"
              data-oid="0ok-5k-"
            >
              <CollapsibleTrigger asChild data-oid="35q.3:m">
                <div
                  className="flex items-center justify-between p-4 bg-card cursor-pointer hover:bg-card/80"
                  data-oid="g7uo:lr"
                >
                  <div className="flex items-center gap-2" data-oid="p9_-l7o">
                    <h2 className="text-lg font-medium" data-oid="j_1h1y1">
                      {project.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="ml-2"
                      data-oid="z-0b29j"
                    >
                      {project.tasks.length} tareas
                    </Badge>
                  </div>
                  {expandedProjects[project.id] ? (
                    <ChevronUp
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="hbgiwx2"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="l_z5.77"
                    />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent data-oid="8.cm-gn">
                <div className="divide-y divide-border" data-oid="8v:7x1p">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 flex items-center justify-between ${
                        task.status === "done" ? "bg-secondary/20" : ""
                      }`}
                      data-oid="kpbh.:h"
                    >
                      <div className="flex-1" data-oid="p3mv.lt">
                        <div
                          className="flex items-center gap-2"
                          data-oid="9cxuqq5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              task.priority === "high"
                                ? "bg-destructive"
                                : task.priority === "medium"
                                  ? "bg-white"
                                  : "bg-muted-foreground"
                            }`}
                            data-oid="784x78l"
                          />

                          <span
                            className={
                              task.status === "done"
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                            data-oid="0c1jb.h"
                          >
                            {task.title}
                          </span>
                          {task.status === "done" && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs"
                              data-oid="fcngxi."
                            >
                              Completada
                            </Badge>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-2 mt-1 text-xs text-muted-foreground"
                          data-oid="wm_40lv"
                        >
                          <Calendar className="h-3 w-3" data-oid="ntqfk86" />
                          <span data-oid="q3z1x0.">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        data-oid="42ps:3v"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => assignTodayDate(task.id)}
                          disabled={
                            task.status === "done" ||
                            Boolean(task.dueDate &&
                              new Date(task.dueDate).toDateString() ===
                                new Date().toDateString())
                          }
                          data-oid="dmi.xb6"
                        >
                          <CalendarCheck
                            className="h-3.5 w-3.5 mr-1"
                            data-oid="rmim0kg"
                          />

                          {task.dueDate &&
                          new Date(task.dueDate).toDateString() ===
                            new Date().toDateString()
                            ? "Para hoy"
                            : "Asignar hoy"}
                        </Button>
                        <Link
                          href={`/projects/${project.id}`}
                          data-oid="9fn62l9"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            data-oid="uey2uqj"
                          >
                            Ver proyecto
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        ) : (
          <div
            className="text-center py-10 border border-border rounded-md"
            data-oid="wr60ltk"
          >
            <p className="text-muted-foreground" data-oid="1wu0:re">
              No hay tareas disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
