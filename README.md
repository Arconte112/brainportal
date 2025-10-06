# BrainPortal – Centro Operativo Personal con IA

BrainPortal es un panel de productividad diseñado para profesionales que necesitan unir **planificación de proyectos, tareas, notas, calendario y analítica** en una sola experiencia. Está construido sobre **Next.js 15**, emplea **Supabase** como backend instantáneo y se integra con **Google Calendar** para sincronizar eventos. Además, incorpora modelos LLM (OpenRouter/OpenAI/Anthropic) para potenciar resúmenes, asistentes y automatización.

## Características clave
- **Gestión integral de proyectos y tareas** con prioridades, estado y métricas.
- **Notas enlazadas** a proyectos y tareas, organizadas por fecha.
- **Calendario inteligente** con sincronización bidireccional vía Google Calendar.
- **Recordatorios y insights** generados automáticamente.
- **Asistente de IA** configurable (Anthropic/OpenAI/OpenRouter) para resumir, clasificar y coordinar acciones.
- **Dashboards** diarios/semanales con visualizaciones y KPIs.

## Stack tecnológico
- **Framework:** Next.js (App Router) + React 19 + TypeScript.
- **UI:** shadcn/ui, Tailwind CSS, Radix UI, recharts.
- **Auth & datos:** Supabase (PostgreSQL + RLS) con tablas normalizadas (`projects`, `tasks`, `notes`, `events`, etc.).
- **Integraciones:** Google Calendar API, OpenAI/OpenRouter/Anthropic.
- **Testing & utilidades:** Playwright (opcional), Vitest, ESLint.

## Estructura de carpetas relevante
```
app/
 ├─ api/                # Endpoints serverless (chat, settings, calendar)
 ├─ hoy/                # Vista "Hoy" con foco en productividad inmediata
 ├─ projects/, reminders/, notes/ ...
lib/
 ├─ ai-config.ts        # Modelos y parámetros por defecto
 ├─ google-auth.ts      # OAuth y persistencia tokens
 ├─ supabaseClient.ts   # Cliente compartido Supabase
 └─ utils/              # Helpers de dominio
migrations/             # Scripts SQL para Supabase
```

## Configuración rápida
### 1. Variables de entorno
Cree un archivo `.env.local` tomando como referencia `.env.example` (o los campos listados a continuación):

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima para el cliente. |
| `SUPABASE_SERVICE_KEY` | (Opcional) Clave `service_role` para jobs server-side. |
| `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | Claves para los proveedores LLM soportados. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales OAuth para Calendar. |
| `GOOGLE_REDIRECT_URI` | Callback URL (`https://tu-dominio/api/auth/google/callback`). |
| `NEXT_PUBLIC_TIME_ZONE` | Zona horaria por defecto (ej. `America/Santo_Domingo`). |

### 2. Dependencias y scripts
```bash
npm install
npm run dev       # http://localhost:3000
npm run lint      # Linter
npm run build     # Build producción
```

### 3. Base de datos (Supabase)
Ejecute el contenido de `database-setup.sql` en el editor SQL de Supabase para crear las tablas, funciones y políticas necesarias. Ajuste las políticas RLS según su esquema de autenticación.

### 4. Integración con Google Calendar
1. Configure un proyecto en Google Cloud y habilite la API de Calendar.
2. Registre las credenciales OAuth y orígenes autorizados.
3. Complete las variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`.
4. Desde la UI, conecte su calendario para habilitar la sincronización automática (`lib/google-auth.ts`).

## Flujo de sincronización de IA
1. Los asistentes se configuran en `lib/ai-config.ts` (modelo, temperatura, contexto).
2. Los endpoints `/api/chat` y `/api/chat/sessions` guardan conversaciones y acciones en Supabase.
3. Puede extenderse añadiendo herramientas en `lib/ai-tools/` o ajustando prompts en `lib/constants.ts`.

## Desarrollo y pruebas
- **Testing básico:** `npm run test` (si hay tests configurados con Vitest/Playwright).
- **Validación de entorno:** `npm run validate:env` (ver `tests/basic-validation.js`).
- **Logs de depuración:** `lib/logger.ts` (usa `pino` en modo serverless).

## Despliegue sugerido
- **Vercel**: Deploy automático conectando el repo. Configure las variables de entorno en el dashboard.
- **Supabase**: Administra la base de datos, storage y cron jobs.
- **Cron tasks**: Puedes programar re-syncs o recordatorios periódicos usando los edge functions (no incluidos de serie).

## Roadmap
- Sincronización bidireccional completa de recordatorios con proveedores externos.
- Automatización de insights via agentes (LangGraph / CrewAI).
- Modo multiusuario y equipos con políticas RLS refinadas.
- Exportación/Importación de proyectos en formato JSON/Markdown.

## Licencia
Distribuido bajo licencia **MIT**.
