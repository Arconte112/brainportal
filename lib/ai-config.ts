import { AIProvider } from '@/types';

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openrouter: {
    name: 'OpenRouter',
    models: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
    ],
    max_tokens: 200000,
    supports_tools: true,
  },
  openai: {
    name: 'OpenAI',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    max_tokens: 128000,
    supports_tools: true,
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
    ],
    max_tokens: 200000,
    supports_tools: true,
  },
};

export const DEFAULT_AI_SETTINGS = {
  model: process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  max_context_tokens: parseInt(process.env.NEXT_PUBLIC_MAX_CONTEXT_TOKENS || '20000'),
  provider: 'openrouter' as const,
  enabled_tools: ['create_task', 'create_project', 'create_note', 'create_reminder', 'get_tasks', 'get_projects'],
  system_prompt: `Eres Cerebro, el asistente de IA de BrainPortal. Tu función es ayudar al usuario con la gestión de tareas, proyectos, notas y recordatorios.

Capabilities:
- Crear, editar y gestionar tareas con prioridades y fechas límite
- Organizar proyectos y asociar tareas con ellos
- Crear notas y vincularlas con tareas o proyectos
- Establecer recordatorios con fechas específicas
- Analizar productividad y ofrecer insights
- Sugerir optimizaciones en el flujo de trabajo

Responde siempre en español y sé conciso pero útil. Prioriza las acciones que el usuario necesita completar.`,
};

export const AVAILABLE_TOOLS = {
  create_task: {
    name: 'crear_tarea',
    description: 'Crea una nueva tarea con título, descripción, prioridad y fecha límite opcional',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la tarea' },
        description: { type: 'string', description: 'Descripción detallada de la tarea' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Prioridad de la tarea' },
        dueDate: { type: 'string', description: 'Fecha límite en formato ISO' },
        projectId: { type: 'string', description: 'ID del proyecto al que pertenece' },
      },
      required: ['title', 'priority'],
    },
  },
  create_project: {
    name: 'crear_proyecto',
    description: 'Crea un nuevo proyecto con nombre, descripción y color',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del proyecto' },
        description: { type: 'string', description: 'Descripción del proyecto' },
        color: { type: 'string', description: 'Color del proyecto en formato hex' },
      },
      required: ['name'],
    },
  },
  create_note: {
    name: 'crear_nota',
    description: 'Crea una nueva nota con título y contenido',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la nota' },
        content: { type: 'string', description: 'Contenido de la nota' },
        projectId: { type: 'string', description: 'ID del proyecto relacionado' },
        taskId: { type: 'string', description: 'ID de la tarea relacionada' },
      },
      required: ['title', 'content'],
    },
  },
  create_reminder: {
    name: 'crear_recordatorio',
    description: 'Crea un nuevo recordatorio con fecha y hora específicas',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título del recordatorio' },
        description: { type: 'string', description: 'Descripción del recordatorio' },
        dateTime: { type: 'string', description: 'Fecha y hora en formato ISO' },
        soundEnabled: { type: 'boolean', description: 'Si debe sonar una alerta' },
      },
      required: ['title', 'dateTime'],
    },
  },
  get_tasks: {
    name: 'obtener_tareas',
    description: 'Obtiene la lista de tareas filtradas por estado o proyecto',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'done'], description: 'Filtrar por estado' },
        projectId: { type: 'string', description: 'Filtrar por proyecto' },
        limit: { type: 'number', description: 'Límite de resultados' },
      },
    },
  },
  get_projects: {
    name: 'obtener_proyectos',
    description: 'Obtiene la lista de proyectos activos',
    parameters: {
      type: 'object',
      properties: {
        includeArchived: { type: 'boolean', description: 'Incluir proyectos archivados' },
      },
    },
  },
};