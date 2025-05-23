import React from 'react';
import { TasksOverview } from '@/components/dashboard/tasks-overview';
import { TasksByPriority } from '@/components/dashboard/tasks-by-priority';
import { ProjectProgressList } from '@/components/dashboard/project-progress-list';
import { ActivityOverTime } from '@/components/dashboard/activity-over-time';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard de Estadísticas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <TasksOverview />
        </div>
        <div className="xl:col-span-1">
          <TasksByPriority />
        </div>
        <div className="md:col-span-2 xl:col-span-1"> {/* Takes full width on md, 1/3 on xl */}
          <UpcomingDeadlines />
        </div>
        
        <div className="md:col-span-2 xl:col-span-3">
          <ActivityOverTime />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <ProjectProgressList />
        </div>
      </div>
    </div>
  );
}
