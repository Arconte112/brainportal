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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartConfig = {
  total: {
    label: "Tareas",
  },
  high: {
    label: "Alta",
    color: "hsl(var(--chart-1))",
  },
  medium: {
    label: "Media",
    color: "hsl(var(--chart-2))",
  },
  low: {
    label: "Baja",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function TasksByPriority() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
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
        <CardHeader><CardTitle>Tareas por Prioridad</CardTitle></CardHeader>
        <CardContent><p>Cargando...</p></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Tareas por Prioridad</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">{error}</p></CardContent>
      </Card>
    );
  }

  const highPriorityCount = tasks.filter(task => task.priority === 'high').length;
  const mediumPriorityCount = tasks.filter(task => task.priority === 'medium').length;
  const lowPriorityCount = tasks.filter(task => task.priority === 'low').length;

  const chartData = [
    { name: 'Alta', total: highPriorityCount, fill: chartConfig.high.color },
    { name: 'Media', total: mediumPriorityCount, fill: chartConfig.medium.color },
    { name: 'Baja', total: lowPriorityCount, fill: chartConfig.low.color },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas por Prioridad</CardTitle>
        <CardDescription>Distribución de tareas según su prioridad.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" dataKey="total" allowDecimals={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="total" radius={5}>
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p>No hay tareas para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}
