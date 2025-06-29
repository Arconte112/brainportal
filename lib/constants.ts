export const POMODORO = {
  WORK_DURATION: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  CYCLES_BEFORE_LONG_BREAK: 4,
} as const;

export const CACHE = {
  DURATION_MS: 5000,
  STALE_TIME_MS: 1000,
} as const;

export const UI = {
  TOAST_DURATION_MS: 4000,
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION_MS: 200,
} as const;

export const API = {
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const TOKEN_LIMITS = {
  DEFAULT_MAX_CONTEXT: 20000,
  DEFAULT_MAX_RESPONSE: 4000,
  MIN_CONTEXT: 1000,
  MAX_CONTEXT: 128000,
} as const;

export const ROUTES = {
  HOME: '/hoy',
  CALENDAR: '/calendar',
  PROJECTS: '/projects',
  NOTES: '/notas',
  INSIGHTS: '/insights',
  REMINDERS: '/reminders',
  SETTINGS: '/settings',
} as const;