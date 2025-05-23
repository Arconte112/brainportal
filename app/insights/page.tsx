"use client";

import React from "react";
import { AppLayout } from "@/components/app-layout";
import { useData } from "@/hooks/data-provider";
import { subDays, format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

export default function InsightsPage() {
  const {
    tasks,
    projects,
    loadingTasks,
    loadingProjects,
  } = useData();

  if (loadingTasks || loadingProjects) {
    return (
      <AppLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md col-span-1 md:col-span-2" />
          <Skeleton className="h-64 w-full rounded-md col-span-1 md:col-span-2" />
        </div>
      </AppLayout>
    );
  }

  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const donePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: "Pendientes", value: pendingTasks, color: "#fbbf24" },
    { name: "Completadas", value: completedTasks, color: "#34d399" }
  ];

  const priorityCounts: Record<string, number> = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  const priorityData = [
    { name: "Alta", value: priorityCounts.high, color: "#f87171" },
    { name: "Media", value: priorityCounts.medium, color: "#60a5fa" },
    { name: "Baja", value: priorityCounts.low, color: "#a3a3a3" }
  ];

  const tasksPerProjectMap: Record<string, number> = tasks.reduce((acc, t) => {
    const project = projects.find(p => p.id === t.projectId);
    const name = project?.name || "Sin proyecto";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const projectData = Object.entries(tasksPerProjectMap).map(([name, value]) => ({ name, value }));
  const projectConfig: Record<string, { label: string; color: string }> = projectData.reduce(
    (cfg, d) => {
      cfg[d.name] = { label: d.name, color: "#7c3aed" };
      return cfg;
    },
    {} as Record<string, { label: string; color: string }>
  );

  
  const today = new Date();
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const key = format(date, "yyyy-MM-dd");
    const count = tasks.filter(t => t.status === "done" && t.dueDate === key).length;
    return { date: format(date, "dd/MM"), count };
  });

  return (
    <AppLayout>
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold">Estadísticas e Insights</h1>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total de tareas</CardTitle>
              <CardDescription>{totalTasks}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={donePercentage} className="h-2" />
              <div className="mt-2 text-sm text-muted-foreground">
                {donePercentage}% completadas
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tareas pendientes</CardTitle>
              <CardDescription>{pendingTasks}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tareas completadas</CardTitle>
              <CardDescription>{completedTasks}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={100} className="h-2" />
            </CardContent>
          </Card>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Distribución por estado</CardTitle>
              <CardDescription>Tareas pendientes vs completadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  pending: { label: "Pendientes", color: "#fbbf24" },
                  done: { label: "Completadas", color: "#34d399" }
                }}
                className="h-60"
              >
                <RechartsPieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
                <ChartTooltip />
                <ChartLegend verticalAlign="middle" align="right" layout="vertical" />
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Distribución por prioridad</CardTitle>
              <CardDescription>Tareas según prioridad</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  high: { label: "Alta", color: "#f87171" },
                  medium: { label: "Media", color: "#60a5fa" },
                  low: { label: "Baja", color: "#a3a3a3" }
                }}
                className="h-60"
              >
                <RechartsPieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
                <ChartTooltip />
                <ChartLegend verticalAlign="middle" align="right" layout="vertical" />
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Tareas por proyecto</CardTitle>
              <CardDescription>Cantidad de tareas por proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={projectConfig}
                className="h-60"
              >
                <BarChart
                  data={projectData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Bar dataKey="value" fill="#7c3aed" />
                </BarChart>
                <ChartTooltip />
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="h-96">
            <CardHeader>
              <CardTitle>Tareas completadas (últimos 7 días)</CardTitle>
              <CardDescription>Actividad diaria</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Completadas", color: "#34d399" } }}
                className="h-60"
              >
                <LineChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
                <ChartTooltip />
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}