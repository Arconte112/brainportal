"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Project = {
  id: string;
  name: string;
  tasksCount: number;
  progress: number;
  archived: boolean;
};

export function Projects() {
  // State for projects enriched with task counts and progress
  interface RawProject {
    id: string;
    name: string;
    archived: boolean;
    color?: string | null;
  }
  interface RawTask {
    project_id: string;
    status: 'pending' | 'done';
  }
  interface UIProject extends RawProject {
    tasksCount: number;
    progress: number;
  }
  const [projects, setProjects] = useState<UIProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para controlar si se muestran los proyectos archivados
  const [showArchived, setShowArchived] = useState(false);
  // Estado para el diálogo de creación de proyecto
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState<string>("");
  const [newColor, setNewColor] = useState<string>(() => {
    // Color por defecto aleatorio
    const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    return `#${rand}`;
  });

  // Filtrar proyectos según el estado de showArchived
  const filteredProjects = showArchived
    ? projects
    : projects.filter((project) => !project.archived);

  // Archivar/desarchivar proyecto en Supabase
  const toggleArchiveProject = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    await supabase
      .from('projects')
      .update({ archived: !proj.archived })
      .eq('id', projectId);
    fetchData();
  };

  // Crear nuevo proyecto en Supabase
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await supabase.from('projects').insert({ name: newName.trim(), color: newColor });
    setNewName('');
    // Nuevo color
    const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    setNewColor(`#${rand}`);
    setCreateOpen(false);
    fetchData();
  };

  // Función para cargar proyectos y tareas desde Supabase
  const fetchData = async () => {
    setLoading(true);
    const { data: prjs, error: prjErr } = await supabase
      .from<RawProject>('projects')
      .select('id,name,archived,color');
    if (prjErr) {
      console.error('Error fetching projects:', prjErr);
      setLoading(false);
      return;
    }
    const { data: tks, error: tksErr } = await supabase
      .from<RawTask>('tasks')
      .select('project_id,status');
    if (tksErr) {
      console.error('Error fetching tasks:', tksErr);
      setLoading(false);
      return;
    }
    // Enriquecer proyectos con conteo y progreso
    const enriched: UIProject[] = prjs.map((p) => {
      const projTasks = tks.filter((t) => t.project_id === p.id);
      const count = projTasks.length;
      const done = projTasks.filter((t) => t.status === 'done').length;
      return {
        ...p,
        tasksCount: count,
        progress: count > 0 ? Math.round((done / count) * 100) : 0,
      };
    });
    setProjects(enriched);
    setLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, []);
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
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-oid="54myu9c">
                <Plus className="h-4 w-4 mr-1" data-oid="dfnow.7" /> Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Crear Proyecto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nombre</Label>
                  <Input
                    id="project-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-color">Color</Label>
                  <input
                    id="project-color"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-8 w-12 p-0 border-none"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Crear</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
