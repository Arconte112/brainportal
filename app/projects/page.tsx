import { AppLayout } from "@/components/app-layout";
import { Projects } from "@/components/projects";
import { supabase } from "@/lib/supabaseClient";

// Definición de tipos (idealmente, mover a un archivo compartido de tipos si se usan en múltiples lugares)
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

export interface UIProject extends RawProject {
  tasksCount: number;
  progress: number;
}

async function getProjectsData(): Promise<UIProject[]> {
  const { data: prjs, error: prjErr } = await supabase
    .from('projects') // No es necesario <RawProject> aquí con el cliente v2 de Supabase
    .select('id,name,archived,color');

  if (prjErr) {
    console.error('Error fetching projects:', prjErr);
    // En un caso real, podrías lanzar el error o retornar un array vacío
    // para que la página pueda manejarlo (ej. mostrar un mensaje de error)
    return [];
  }
  if (!prjs) {
    return [];
  }

  const { data: tks, error: tksErr } = await supabase
    .from('tasks') // No es necesario <RawTask> aquí
    .select('project_id,status');

  if (tksErr) {
    console.error('Error fetching tasks:', tksErr);
    // Considerar cómo manejar errores parciales. ¿Mostrar proyectos sin info de tareas?
    return prjs.map(p => ({
        ...p,
        tasksCount: 0,
        progress: 0,
        // Asegurar que todos los campos de UIProject estén presentes
        id: p.id,
        name: p.name,
        archived: p.archived,
        color: p.color,
    }));
  }
  if (!tks) {
     return prjs.map(p => ({
        ...p,
        tasksCount: 0,
        progress: 0,
        id: p.id,
        name: p.name,
        archived: p.archived,
        color: p.color,
    }));
  }

  const enriched: UIProject[] = prjs.map((p) => {
    const projTasks = tks.filter((t) => t.project_id === p.id);
    const count = projTasks.length;
    const done = projTasks.filter((t) => t.status === 'done').length;
    return {
      ...p,
      id: p.id, // Asegurar que id esté explícitamente
      name: p.name, // Asegurar que name esté explícitamente
      archived: p.archived, // Asegurar que archived esté explícitamente
      color: p.color, // Asegurar que color esté explícitamente
      tasksCount: count,
      progress: count > 0 ? Math.round((done / count) * 100) : 0,
    };
  });
  return enriched;
}

export default async function ProjectsPage() {
  const initialProjects = await getProjectsData();
  return (
    <AppLayout data-oid="whpf3xr">
      <Projects initialProjects={initialProjects} data-oid="zeq0r1w" />
    </AppLayout>
  );
}
