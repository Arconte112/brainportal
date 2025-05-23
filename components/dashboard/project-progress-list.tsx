'use client';

import React, { useEffect, useState } from 'react';
import { getAllProjects, getAllTasks } from '@/lib/dashboard-data';
import { Project, Task } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProjectWithProgress extends Project {
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

export function ProjectProgressList() {
  const [projectsWithProgress, setProjectsWithProgress] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [projects, tasks] = await Promise.all([
          getAllProjects(),
          getAllTasks(),
        ]);

        const enrichedProjects = projects
          .filter(p => !p.archived) // Filter out archived projects
          .map(project => {
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(task => task.status === 'done').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return { ...project, progress, totalTasks, completedTasks };
          });

        setProjectsWithProgress(enrichedProjects);
        setError(null);
      } catch (err) {
        setError('Error al cargar datos de proyectos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Progreso de Proyectos</CardTitle></CardHeader>
        <CardContent><p>Cargando...</p></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Progreso de Proyectos</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">{error}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progreso de Proyectos</CardTitle>
        <CardDescription>Seguimiento del avance de cada proyecto activo.</CardDescription>
      </CardHeader>
      <CardContent>
        {projectsWithProgress.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
            {projectsWithProgress.map(project => (
              <div key={project.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium">{project.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {project.completedTasks}/{project.totalTasks}
                  </span>
                </div>
                <Progress value={project.progress} className="w-full" />
              </div>
            ))}
          </div>
        ) : (
          <p>No hay proyectos activos para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}
