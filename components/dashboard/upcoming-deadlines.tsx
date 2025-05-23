'use client';

import React, { useEffect, useState } from 'react';
import { getAllTasks } from '@/lib/dashboard-data';
import { Task } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInDays, isFuture, isToday, isValid } from 'date-fns';

export function UpcomingDeadlines() {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const allTasks = await getAllTasks();
        
        const todayForComparison = new Date(); // Use a stable 'today' for all comparisons in filter
        // Set hours, minutes, seconds, and milliseconds to 0 to compare dates only
        todayForComparison.setHours(0, 0, 0, 0);


        const filteredTasks = allTasks
          .filter(task => {
            if (task.status === 'done' || !task.dueDate) return false;
            try {
              const dueDate = parseISO(task.dueDate);
              if (!isValid(dueDate)) return false; // Skip invalid dates
              
              // Ensure dueDate is also compared date-only
              const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

              const daysDifference = differenceInDays(dueDateOnly, todayForComparison);
              
              // Include tasks due today or in the next 7 days
              // (isToday or isFuture ensures we don't include past dates, differenceInDays handles the 7-day window)
              return (isToday(dueDateOnly) || isFuture(dueDateOnly)) && daysDifference >= 0 && daysDifference <= 7;
            } catch {
              return false; // Invalid date format or other error during parsing
            }
          })
          .sort((a, b) => {
            // Ensure dueDate is valid before attempting to parse
            const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
            return dateA - dateB;
          });

        setUpcomingTasks(filteredTasks);
        setError(null);
      } catch (err) {
        setError('Error al cargar tareas');
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
        <CardHeader><CardTitle>Próximos Vencimientos</CardTitle></CardHeader>
        <CardContent><p>Cargando...</p></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Próximos Vencimientos</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">{error}</p></CardContent>
      </Card>
    );
  }

  const getPriorityVariant = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Vencimientos</CardTitle>
        <CardDescription>Tareas pendientes para los próximos 7 días.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2"> {/* Scrollable list with padding for scrollbar */}
            {upcomingTasks.map(task => (
              <div key={task.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{task.title}</h4>
                  <Badge variant={getPriorityVariant(task.priority)}>{task.priority || 'normal'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vence: {task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay tareas con vencimiento próximo.</p>
        )}
      </CardContent>
    </Card>
  );
}
