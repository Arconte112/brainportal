base de datos:

-- Habilitar extensiones (si no están ya habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM Types
-- Para el estado de las tareas
CREATE TYPE task_status_enum AS ENUM ('pending', 'done');
-- Para la prioridad (usada en tareas y eventos)
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high');

-- 2. Tabla de Proyectos (Projects)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- e.g., '#RRGGBB'
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Tareas (Tasks)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status_enum DEFAULT 'pending',
    priority priority_enum DEFAULT 'medium',
    due_date DATE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Notas (Notes)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Eventos del Calendario (Events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    priority priority_enum DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_end_time_after_start_time CHECK (end_time > start_time)
);

-- 6. Tabla de Enlace Tarea-Nota (Muchos a Muchos)
CREATE TABLE task_note_links (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (task_id, note_id)
);

-- 7. Tabla de Configuración de la Aplicación (App Settings)
-- Reemplaza user_preferences, ya que solo hay un "usuario"
CREATE TABLE app_settings (
    id INT PRIMARY KEY DEFAULT 1, -- Solo habrá una fila de configuración
    dark_mode BOOLEAN DEFAULT TRUE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    task_reminders BOOLEAN DEFAULT TRUE,
    event_alerts BOOLEAN DEFAULT TRUE,
    default_view TEXT DEFAULT 'today', -- Podría ser un ENUM ('today', 'calendar', 'projects')
    time_format TEXT DEFAULT '24h', -- Podría ser un ENUM ('12h', '24h')
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_app_settings CHECK (id = 1) -- Asegura que solo haya una fila
);

-- Insertar la fila de configuración por defecto
INSERT INTO app_settings (id) VALUES (1);


-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_archived ON projects(archived);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_notes_date ON notes(date);

CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_end_time ON events(end_time);

CREATE INDEX idx_task_note_links_task_id ON task_note_links(task_id);
CREATE INDEX idx_task_note_links_note_id ON task_note_links(note_id);


-- Función para actualizar automáticamente `updated_at`
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at`
CREATE TRIGGER set_timestamp_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tasks
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notes
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_app_settings
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Row Level Security (RLS)
-- Para una aplicación de un solo usuario sin login, si usas la clave `anon` de Supabase
-- desde el frontend, necesitas permitir el acceso a esta clave.
-- Si tu acceso es solo desde un backend con la `service_role` key, RLS es menos crítico
-- pero sigue siendo una buena práctica.

-- Asumimos que se usará la clave anónima (anon) para el acceso.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users on projects" ON projects FOR ALL TO anon USING (true);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users on tasks" ON tasks FOR ALL TO anon USING (true);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users on notes" ON notes FOR ALL TO anon USING (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users on events" ON events FOR ALL TO anon USING (true);

ALTER TABLE task_note_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for anon users on task_note_links" ON task_note_links FOR ALL TO anon USING (true);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for anon users on app_settings" ON app_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Enable update access for anon users on app_settings" ON app_settings FOR UPDATE TO anon USING (id = 1); -- Solo permitir actualizar la única fila
-- No permitir INSERT o DELETE en app_settings por el rol anon para mantener una única fila.

# Proyect Overview:

# BrainPortal - Project Overview

BrainPortal es una aplicación web de productividad minimalista diseñada para ayudar a los usuarios a organizar sus tareas, proyectos y calendario.

## Características Principales Identificadas:

*   **Gestión de Tareas y Proyectos:** Se infiere por la estructura de directorios `app/projects/` y `app/projects/tasks/`, y los componentes como `[project-tasks-list.tsx](mdc:components/project-tasks-list.tsx)` y `[project-detail.tsx](mdc:components/project-detail.tsx)`.
*   **Calendario/Agenda:** Indicado por `app/calendar/`, el componente `[weekly-calendar.tsx](mdc:components/weekly-calendar.tsx)` y la sección de "Eventos de hoy" y "Próximos eventos" en `[app-layout.tsx](mdc:components/app-layout.tsx)`.
*   **Archivo:** Una sección para archivar elementos, visible en `app/archive/` y `[archive.tsx](mdc:components/archive.tsx)`.
*   **Configuración:** Sección de ajustes en `app/settings/` y `[settings.tsx](mdc:components/settings.tsx)`.
*   **Dashboard Principal:** Punto de entrada que muestra información relevante, implementado en `[dashboard.tsx](mdc:components/dashboard.tsx)`.
*   **Modo Foco:** Una funcionalidad para minimizar distracciones ocultando la barra lateral y la barra superior, controlada en `[app-layout.tsx](mdc:components/app-layout.tsx)`.
*   **ChatBot:** Un asistente de chat, componente `[chat-bot.tsx](mdc:components/chat-bot.tsx)`, accesible mediante la barra espaciadora.
*   **Creación Rápida (Quick Create):** Funcionalidad para crear elementos rápidamente, accesible con la tecla 'c' (actualmente en desarrollo, según `[app-layout.tsx](mdc:components/app-layout.tsx)`).

## Tecnologías Utilizadas:

*   **Framework Principal:** [Next.js (v15.2.4)](https://nextjs.org/) - Un framework de React para producción.
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) - JavaScript con tipado estático.
*   **UI (Interfaz de Usuario):**
    *   [React (v19)](https://react.dev/) - Biblioteca para construir interfaces de usuario.
    *   [Shadcn/UI](https://ui.shadcn.com/) - Colección de componentes de UI reutilizables. Se evidencia por el uso de `@radix-ui/*`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` y `[components.json](mdc:components.json)`.
    *   [Tailwind CSS](https://tailwindcss.com/) - Framework CSS "utility-first". Configurado en `[tailwind.config.ts](mdc:tailwind.config.ts)`.
*   **Gestión de Formularios:** [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/) para validación.
*   **Componentes de UI Adicionales:**
    *   Calendarios/Fechas: `date-fns`, `react-day-picker`.
    *   Gráficos: `recharts`.
    *   Notificaciones (Toasts): `sonner`.
*   **Gestor de Paquetes:** Se infiere el uso de `pnpm` por `pnpm-lock.yaml` o `bun` por `bun.lock`. El archivo `package.json` es el manifiesto del proyecto.

## Puntos de Entrada y Estructura Clave:

*   **Layout Principal:** `[app/layout.tsx](mdc:app/layout.tsx)` define la estructura HTML base, tema (oscuro por defecto) y proveedor de notificaciones.
*   **Página de Inicio:** `[app/page.tsx](mdc:app/page.tsx)` renderiza el `[AppLayout](mdc:components/app-layout.tsx)` y el `[Dashboard](mdc:components/dashboard.tsx)`.
*   **Layout de la Aplicación:** `[components/app-layout.tsx](mdc:components/app-layout.tsx)` contiene la lógica principal de la disposición de la UI, incluyendo `[AppSidebar](mdc:components/app-sidebar.tsx)`, `[TopBar](mdc:components/top-bar.tsx)`, y la gestión del modo foco y eventos.

## Configuración del Proyecto:

*   **Next.js:** Configurado en `[next.config.mjs](mdc:next.config.mjs)`. Destaca la omisión de errores de ESLint/TypeScript en el build y la no optimización de imágenes.
*   **TypeScript:** Configurado en `[tsconfig.json](mdc:tsconfig.json)`.
    shadui
*   **Tailwind CSS:** Configurado en `[tailwind.config.ts](mdc:tailwind.config.ts)` y `[postcss.config.mjs](mdc:postcss.config.mjs)`.
*   **Estilos Globales:** `[app/globals.css](mdc:app/globals.css)`.

