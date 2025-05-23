'use client';

import React, { useEffect, useState } from 'react';
import { getAllTasks } from '@/lib/dashboard-data';
import { Task } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chartConfig = {
  completed: {
    label: 'Completadas',
    color: 'hsl(var(--chart-1))',
  },
  pending: {
    label: 'Pendientes',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function TasksOverview() {
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
        <CardHeader>
          <CardTitle>Resumen de Tareas</CardTitle>
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
          <CardTitle>Resumen de Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const completedTasksCount = tasks.filter(task => task.status === 'done').length;
  const pendingTasksCount = tasks.length - completedTasksCount;
  const totalTasks = tasks.length;

  const chartData = [
    { name: 'completed', value: completedTasksCount, fill: chartConfig.completed.color },
    { name: 'pending', value: pendingTasksCount, fill: chartConfig.pending.color },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Tareas</CardTitle>
        <CardDescription>
          Total: {totalTasks} | Completadas: {completedTasksCount} | Pendientes: {pendingTasksCount}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend content={({ payload }) => {
                  return (
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {payload?.map((entry) => (
                        <li key={`legend-${entry.value}`} className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{chartConfig[entry.value as keyof typeof chartConfig]?.label}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p>No hay tareas para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}
