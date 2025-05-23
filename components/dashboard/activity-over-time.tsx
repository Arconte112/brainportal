'use client';

import React, { useEffect, useState } from 'react';
import { getAllTasks, getAllNotes } from '@/lib/dashboard-data';
import { Task, Note } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, format, subDays, parseISO, isValid } from 'date-fns';

const chartConfig = {
  notesCreated: { label: "Notas Creadas", color: "hsl(var(--chart-1))" },
  tasksDue: { label: "Tareas (Vencimiento)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

interface DailyActivity {
  date: string; // Formatted date string e.g., "May 20"
  notesCreated: number;
  tasksDue: number;
}

export function ActivityOverTime() {
  const [activityData, setActivityData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [tasks, notes] = await Promise.all([getAllTasks(), getAllNotes()]);
        
        const today = new Date();
        const last30Days = eachDayOfInterval({
          start: subDays(today, 29),
          end: today,
        });

        const processedData = last30Days.map(dayDate => {
          const formattedDate = format(dayDate, 'MMM dd');
          
          const notesOnDay = notes.filter(note => {
            try {
              const noteDate = parseISO(note.date);
              return isValid(noteDate) && format(noteDate, 'MMM dd') === formattedDate;
            } catch { return false; }
          }).length;
          
          const tasksDueOnDay = tasks.filter(task => {
            try {
              return task.dueDate && isValid(parseISO(task.dueDate)) && format(parseISO(task.dueDate), 'MMM dd') === formattedDate;
            } catch { return false; }
          }).length;

          return {
            date: formattedDate,
            notesCreated: notesOnDay,
            tasksDue: tasksDueOnDay,
          };
        });

        setActivityData(processedData);
        setError(null);
      } catch (err) {
        setError('Error al cargar actividad reciente');
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
        <CardHeader>
          <CardTitle>Actividad Reciente (Últimos 30 Días)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente (Últimos 30 Días)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente (Últimos 30 Días)</CardTitle>
        <CardDescription>
          Notas creadas y tareas con vencimiento en el período.
          No se muestran tareas creadas o completadas por día debido a la falta de campos 'createdAt' o 'completedAt' en los datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activityData.length > 0 ? (
          <>
            {/* Notes Chart */}
            <div>
              <h3 className="text-md font-semibold mb-2">Notas Creadas</h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer>
                  <LineChart data={activityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltipContent indicator="line" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="notesCreated" stroke={chartConfig.notesCreated.color} strokeWidth={2} dot={false} name={chartConfig.notesCreated.label}/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Tasks Due Chart */}
            <div>
              <h3 className="text-md font-semibold mb-2">Tareas por Vencimiento</h3>
               <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer>
                  <LineChart data={activityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltipContent indicator="line" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="tasksDue" stroke={chartConfig.tasksDue.color} strokeWidth={2} dot={false} name={chartConfig.tasksDue.label}/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        ) : (
          <p>No hay datos de actividad para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}
