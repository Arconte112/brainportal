"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Folder,
  Plus,
  Eye,
  EyeOff,
  Archive,
  MoreVertical,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Project = {
  id: string;
  name: string;
  tasksCount: number;
  progress: number;
  archived: boolean;
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Rediseño Web",
      tasksCount: 12,
      progress: 75,
      archived: false,
    },
    {
      id: "2",
      name: "Campaña Marketing",
      tasksCount: 8,
      progress: 30,
      archived: false,
    },
    {
      id: "3",
      name: "Desarrollo App",
      tasksCount: 24,
      progress: 45,
      archived: true,
    },
    {
      id: "4",
      name: "Investigación UX",
      tasksCount: 6,
      progress: 90,
      archived: false,
    },
    {
      id: "5",
      name: "Proyecto Antiguo",
      tasksCount: 15,
      progress: 100,
      archived: true,
    },
  ]);

  // Estado para controlar si se muestran los proyectos archivados
  const [showArchived, setShowArchived] = useState(false);

  // Filtrar proyectos según el estado de showArchived
  const filteredProjects = showArchived
    ? projects
    : projects.filter((project) => !project.archived);

  // Función para archivar/desarchivar un proyecto
  const toggleArchiveProject = (projectId: string) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId
          ? { ...project, archived: !project.archived }
          : project,
      ),
    );
  };

  return (
    <div className="space-y-6" data-oid="23uv6rf">
      <div className="flex items-center justify-between" data-oid="7-5vfoj">
        <h1 className="text-2xl font-bold" data-oid="lqdpz:0">
          Proyectos
        </h1>
        <div className="flex gap-2" data-oid="dzneyin">
          <Link href="/projects/tasks" data-oid="1b8mcjk">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              data-oid=":frnpf7"
            >
              <ListTodo className="h-4 w-4" data-oid="z7ltj_s" />
              Ver tareas
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowArchived(!showArchived)}
            title={showArchived ? "Ocultar archivados" : "Mostrar archivados"}
            data-oid="yddah6s"
          >
            {showArchived ? (
              <EyeOff className="h-4 w-4" data-oid="nd2g67_" />
            ) : (
              <Eye className="h-4 w-4" data-oid="kbkc647" />
            )}
          </Button>
          <Button size="sm" data-oid="54myu9c">
            <Plus className="h-4 w-4 mr-1" data-oid="dfnow.7" /> Nuevo Proyecto
          </Button>
        </div>
      </div>

      {showArchived && (
        <div
          className="bg-secondary/20 text-sm px-4 py-2 rounded-md"
          data-oid="bj89lof"
        >
          Mostrando todos los proyectos, incluidos los archivados.
        </div>
      )}

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-oid="ku:odm9"
      >
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className={`bg-card hover:bg-card/80 transition-colors ${project.archived ? "opacity-70" : ""}`}
            data-oid="k9wo-n:"
          >
            <CardHeader
              className="pb-2 flex flex-row items-start justify-between"
              data-oid="g1v862m"
            >
              <Link
                href={`/projects/${project.id}`}
                className="flex-1"
                data-oid="ag_u3vy"
              >
                <CardTitle
                  className="text-base flex items-center"
                  data-oid="mufr.rg"
                >
                  <Folder
                    className="h-4 w-4 mr-2 text-muted-foreground"
                    data-oid="trkyont"
                  />

                  {project.name}
                  {project.archived && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs"
                      data-oid="hzgb9l7"
                    >
                      Archivado
                    </Badge>
                  )}
                </CardTitle>
              </Link>
              <DropdownMenu data-oid="8c-7nb7">
                <DropdownMenuTrigger asChild data-oid="18yujzd">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-oid="kajcaz7"
                  >
                    <MoreVertical className="h-4 w-4" data-oid="7-h.pv7" />
                    <span className="sr-only" data-oid="8th5wqc">
                      Acciones
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-oid="v_d.6v7">
                  <DropdownMenuItem
                    onClick={() => toggleArchiveProject(project.id)}
                    data-oid="v070y89"
                  >
                    <Archive className="h-4 w-4 mr-2" data-oid="h4ogyt5" />
                    {project.archived ? "Desarchivar" : "Archivar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent data-oid="c2dq-l0">
              <Link
                href={`/projects/${project.id}`}
                className="block"
                data-oid=":y27n9c"
              >
                <div
                  className="flex justify-between text-sm text-muted-foreground mb-2"
                  data-oid="e3xxij."
                >
                  <span data-oid="lse-3gu">{project.tasksCount} tareas</span>
                  <span data-oid=":mbvrfx">{project.progress}% completado</span>
                </div>
                <div
                  className="w-full bg-secondary h-1 rounded-full overflow-hidden"
                  data-oid=":2ez7ns"
                >
                  <div
                    className={`h-full ${project.progress === 100 ? "bg-green-500" : "bg-white"}`}
                    style={{ width: `${project.progress}%` }}
                    data-oid="o7hgkg_"
                  />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-10" data-oid="8gl2vv1">
          <p className="text-muted-foreground" data-oid="5ug7-w_">
            No hay proyectos disponibles
          </p>
        </div>
      )}
    </div>
  );
}
