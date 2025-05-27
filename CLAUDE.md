# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## BrainPortal - Next.js Productivity Application

### Available Commands
```bash
# Development
bun dev              # Start development server on localhost:3000
bun build            # Build for production
bun start            # Start production server
bun lint             # Run ESLint

# Docker (production)
docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> .
```

### Tech Stack & Architecture
- **Framework**: Next.js 15.2.4 with App Router
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI**: Radix UI components + Tailwind CSS + shadcn/ui
- **State Management**: React Context (`DataProvider`) + Custom hooks with optimistic updates
- **Language**: TypeScript with strict mode
- **Runtime**: Bun for package management and builds

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

**Database Integration:**
- Primary client: `lib/supabaseClient.ts`
- Real-time subscriptions to table changes
- PostgreSQL schema with tables for tasks, projects, notes, reminders, events
- Automatic optimistic UI updates with database synchronization

### App Structure
```
/app/                   # Next.js App Router pages
  /hoy/                # "Today" view - main dashboard with tasks, events, timer
  /calendar/           # Weekly calendar view
  /projects/           # Project management with kanban-style task organization
  /notas/             # Notes management interface
  /insights/          # Analytics dashboard (new feature)
  /settings/          # User preferences and configuration
```

### Key Components
- `components/app-sidebar.tsx`: Main navigation with keyboard shortcuts
- `components/dashboard.tsx`: Today's overview with task progress and events
- `components/pomodoro.tsx`: Timer integration for focus sessions
- `hooks/data-provider.tsx`: Global state management with context
- `hooks/use-realtime-data.tsx`: Supabase real-time subscriptions

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
TZ=America/Santo_Domingo
```

### Development Notes
- Uses optimistic UI updates for instant user feedback
- Real-time collaboration via Supabase subscriptions
- Responsive design with mobile-first approach
- Dark theme support via `next-themes`
- Keyboard shortcuts: Space opens chat, various focus modes
- Drag & drop functionality for task management