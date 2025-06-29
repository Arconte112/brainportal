# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## BrainPortal - Next.js Productivity Application

### Available Commands
```bash
# Development
npm run dev              # Start development server on localhost:3000

# Docker (production)
docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> -t brainportal .
docker run -p 3000:3000 brainportal

# Testing (basic validation scripts)
node tests/basic-validation.js
node tests/functional-tests.js
node tests/ai-chat-validation.js
node tests/token-utils-test.js
```

### Tech Stack & Architecture
- **Framework**: Next.js 15.2.4 with App Router
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI**: Radix UI components + Tailwind CSS + shadcn/ui
- **State Management**: React Context (`DataProvider`) + Custom hooks with optimistic updates
- **Language**: TypeScript with strict mode
- **Runtime**: npm for package management and builds
- **AI Integration**: OpenAI-compatible APIs via OpenRouter

### Key Architecture Patterns

**Data Management:**
- Global state via `hooks/data-provider.tsx` with React Context
- Real-time Supabase subscriptions through `hooks/use-realtime-data.tsx`
- Optimistic updates: UI updates immediately, syncs to database
- Global cache with 5-second duration to minimize API calls
- Automatic data synchronization across all components

**Core Data Models (types/index.ts):**
- `Task`: Todo items with priority, due dates, project associations
- `Project`: Containers for organizing tasks and notes
- `Note`: Text content linked to projects/tasks
- `Reminder`: Time-based notifications
- `Event`: Calendar events with priorities
- `ChatSession` & `ChatMessage`: AI assistant conversations

**Database Integration:**
- Primary client: `lib/supabaseClient.ts`
- Two database schemas:
  1. Main app tables: projects, tasks, notes, reminders, events
  2. AI system tables: chat_sessions, chat_messages, ai_settings
- Real-time subscriptions to table changes
- Row Level Security (RLS) enabled on all tables

### App Structure
```
/app/                   # Next.js App Router pages
  /hoy/                # "Today" view - main dashboard with tasks, events, timer
  /calendar/           # Weekly calendar view
  /projects/           # Project management with kanban-style task organization
  /notas/             # Notes management interface
  /insights/          # Analytics dashboard with productivity metrics
  /reminders/         # Reminder management
  /settings/          # User preferences and AI configuration
  /api/               # API routes for chat and settings
```

### Key Components
- `components/app-sidebar.tsx`: Main navigation with keyboard shortcuts
- `components/dashboard.tsx`: Today's overview with task progress and events
- `components/pomodoro.tsx`: Timer integration for focus sessions
- `components/insights-dashboard.tsx`: Analytics and productivity metrics
- `hooks/data-provider.tsx`: Global state management with context
- `hooks/use-realtime-data.tsx`: Supabase real-time subscriptions
- `hooks/use-chat-sessions.tsx`: AI chat session management
- `hooks/use-ai-settings.tsx`: AI configuration management

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Optional (AI features)
OPENROUTER_API_KEY=<your-api-key>
NEXT_PUBLIC_DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet
NEXT_PUBLIC_MAX_CONTEXT_TOKENS=20000

# Timezone (defaults to America/Santo_Domingo)
TZ=America/Santo_Domingo
```

### Development Notes
- Uses optimistic UI updates for instant user feedback
- Real-time collaboration via Supabase subscriptions
- Responsive design with mobile-first approach
- Dark theme support via `next-themes`
- Keyboard shortcuts: Space opens AI chat, 'c' for quick create
- Drag & drop functionality for task management
- Primary language: Spanish (UI and content)
- AI assistant "Cerebro" with tool capabilities for task/project management