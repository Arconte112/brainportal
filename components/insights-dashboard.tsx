"use client";

import { useState, useMemo } from "react";
import { useData } from "@/hooks/data-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Target, TrendingUp, PieChart, Activity, BarChart3, LineChart, Users, Zap, Award, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from "recharts";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b', 
  low: '#10b981'
};

export function InsightsDashboard() {
  const { tasks, projects, notes, loadingTasks, loadingProjects } = useData();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const insights = useMemo(() => {
    if (loadingTasks || loadingProjects) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Estadísticas por prioridad
    const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length;
    const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length;

    // Tareas con fecha de vencimiento
    const tasksWithDueDate = tasks.filter(task => task.dueDate).length;
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      return new Date(task.dueDate) < new Date();
    }).length;

    // Estadísticas por proyecto
    const projectStats = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedProjectTasks = projectTasks.filter(task => task.status === 'done').length;
      const projectProgress = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0;
      
      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: completedProjectTasks,
        progress: projectProgress
      };
    });

    // Productividad por período
    const getDaysForRange = (range: string) => {
      const days = range === '30d' ? 30 : range === '90d' ? 90 : 7;
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
    };

    const timeRangeDays = getDaysForRange(timeRange);
    const productivityData = timeRangeDays.map(date => {
      const dayTasks = tasks.filter(task => task.dueDate === date);
      const completed = dayTasks.filter(task => task.status === 'done').length;
      const pending = dayTasks.filter(task => task.status === 'pending').length;
      const inProgress = dayTasks.filter(task => task.status === 'in_progress').length;
      
      return {
        date,
        completed,
        pending,
        inProgress,
        total: dayTasks.length,
        completionRate: dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0
      };
    });

    // Datos para gráficos de barras por prioridad
    const priorityData = [
      {
        priority: 'Alta',
        completed: tasks.filter(t => t.priority === 'high' && t.status === 'done').length,
        pending: tasks.filter(t => t.priority === 'high' && t.status === 'pending').length,
        inProgress: tasks.filter(t => t.priority === 'high' && t.status === 'in_progress').length,
        total: highPriorityTasks
      },
      {
        priority: 'Media',
        completed: tasks.filter(t => t.priority === 'medium' && t.status === 'done').length,
        pending: tasks.filter(t => t.priority === 'medium' && t.status === 'pending').length,
        inProgress: tasks.filter(t => t.priority === 'medium' && t.status === 'in_progress').length,
        total: mediumPriorityTasks
      },
      {
        priority: 'Baja',
        completed: tasks.filter(t => t.priority === 'low' && t.status === 'done').length,
        pending: tasks.filter(t => t.priority === 'low' && t.status === 'pending').length,
        inProgress: tasks.filter(t => t.priority === 'low' && t.status === 'in_progress').length,
        total: lowPriorityTasks
      }
    ];

    // Datos para gráfico de dona de distribución de estado
    const statusDistribution = [
      { name: 'Completadas', value: completedTasks, color: '#10b981' },
      { name: 'En Progreso', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
      { name: 'Pendientes', value: pendingTasks, color: '#ef4444' }
    ];

    // Estadísticas avanzadas
    const avgCompletionTime = completedTasks > 0 ? Math.round(completedTasks / 7) : 0;
    const productivityScore = Math.round((completedTasks / Math.max(totalTasks, 1)) * 100);
    const weeklyGrowth = productivityData.length >= 7 ? 
      ((productivityData.slice(-3).reduce((acc, day) => acc + day.completed, 0) / 3) - 
       (productivityData.slice(0, 3).reduce((acc, day) => acc + day.completed, 0) / 3)) / 
      Math.max((productivityData.slice(0, 3).reduce((acc, day) => acc + day.completed, 0) / 3), 1) * 100 : 0;
    
    const streakDays = (() => {
      let streak = 0;
      for (let i = productivityData.length - 1; i >= 0; i--) {
        if (productivityData[i].completed > 0) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    })();

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overallProgress,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      tasksWithDueDate,
      overdueTasks,
      projectStats,
      productivityData,
      priorityData,
      statusDistribution,
      avgCompletionTime,
      productivityScore,
      weeklyGrowth,
      streakDays,
      totalProjects: projects.length,
      totalNotes: notes.length
    };
  }, [tasks, projects, notes, loadingTasks, loadingProjects]);

  if (loadingTasks || loadingProjects) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
              Analytics Hub
            </h1>
            <p className="text-muted-foreground mt-1">Insights profundos sobre tu productividad y rendimiento</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
            Analytics Hub
          </h1>
          <p className="text-muted-foreground mt-1">Insights profundos sobre tu productividad y rendimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 to-violet-600/5 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">Score de Productividad</CardTitle>
            <Zap className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">{insights.productivityScore}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">+{Math.abs(insights.weeklyGrowth).toFixed(1)}% esta semana</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Racha Actual</CardTitle>
            <Award className="h-5 w-5 text-cyan-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{insights.streakDays}</div>
            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1">
              {insights.streakDays === 1 ? 'día consecutivo' : 'días consecutivos'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Tareas Completadas</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{insights.completedTasks}</div>
            <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${insights.overallProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -translate-y-10 translate-x-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Tareas Críticas</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{insights.overdueTasks}</div>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
              {insights.highPriorityTasks} alta prioridad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por Estado */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-violet-500" />
                  Distribución por Estado
                </CardTitle>
                <CardDescription>Estado actual de todas las tareas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={insights.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {insights.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} tareas`, name]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Análisis por Prioridad */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-500" />
                  Análisis por Prioridad
                </CardTitle>
                <CardDescription>Distribución de tareas según prioridad</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insights.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="priority" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completadas" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="En Progreso" />
                    <Bar dataKey="pending" stackId="a" fill="#ef4444" name="Pendientes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Productividad en el Tiempo */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Tendencia de Productividad
              </CardTitle>
              <CardDescription>Evolución de tareas completadas en los últimos {timeRange === '7d' ? '7 días' : timeRange === '30d' ? '30 días' : '90 días'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={insights.productivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return timeRange === '7d' ? 
                        date.toLocaleDateString('es-ES', { weekday: 'short' }) :
                        date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completadas" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="% Completadas"
                    yAxisId="right"
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Progreso por Proyecto */}
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Progreso por Proyecto
              </CardTitle>
              <CardDescription>Estado de avance detallado en cada proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {insights.projectStats.map((project) => (
                  <div key={project.id} className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm" 
                          style={{ backgroundColor: project.color || '#666' }}
                        />
                        <div>
                          <span className="font-medium text-lg">{project.name}</span>
                          <p className="text-sm text-muted-foreground">{project.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{Math.round(project.progress)}%</span>
                          <Badge variant={project.progress > 80 ? "default" : project.progress > 50 ? "secondary" : "destructive"}>
                            {project.progress > 80 ? "Excelente" : project.progress > 50 ? "En progreso" : "Necesita atención"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {project.completedTasks} de {project.totalTasks} tareas
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={project.progress} className="h-3" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                    </div>
                  </div>
                ))}
                {insights.projectStats.length === 0 && (
                  <div className="text-center py-12 rounded-lg bg-muted/10 border-2 border-dashed border-muted">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No hay proyectos creados aún</p>
                    <p className="text-muted-foreground/70 text-sm">Crea tu primer proyecto para ver el análisis aquí</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas Avanzadas */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Métricas de Rendimiento
                </CardTitle>
                <CardDescription>Análisis profundo de tu productividad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.avgCompletionTime}</div>
                    <p className="text-sm text-purple-600/70 dark:text-purple-400/70">Tareas/semana promedio</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.totalProjects}</div>
                    <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Proyectos activos</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.totalNotes}</div>
                    <p className="text-sm text-green-600/70 dark:text-green-400/70">Notas creadas</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(insights.overallProgress)}%</div>
                    <p className="text-sm text-orange-600/70 dark:text-orange-400/70">Progreso general</p>
                  </div>
                </div>

                {/* Gráfico de barras radial */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Distribución de Prioridades</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={[
                      { name: 'Alta', value: insights.highPriorityTasks, fill: '#ef4444' },
                      { name: 'Media', value: insights.mediumPriorityTasks, fill: '#f59e0b' },
                      { name: 'Baja', value: insights.lowPriorityTasks, fill: '#10b981' }
                    ]}>
                      <RadialBar dataKey="value" cornerRadius={4} fill="#8884d8" />
                      <Tooltip 
                        formatter={(value, name) => [`${value} tareas`, `Prioridad ${name}`]}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recomendaciones IA */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Recomendaciones Inteligentes
                </CardTitle>
                <CardDescription>Insights personalizados para mejorar tu productividad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.overdueTasks > 0 && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700 dark:text-red-400">Atención: Tareas Vencidas</p>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80">
                          Tienes {insights.overdueTasks} tareas vencidas. Considera repriorizarlas o dividirlas en subtareas más pequeñas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {insights.productivityScore > 80 && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">¡Excelente trabajo!</p>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80">
                          Tu score de productividad es de {insights.productivityScore}%. Mantén este ritmo constante.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {insights.streakDays >= 3 && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-700 dark:text-purple-400">Racha Impresionante</p>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                          {insights.streakDays} días consecutivos completando tareas. ¡Sigue así!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {insights.highPriorityTasks > insights.mediumPriorityTasks + insights.lowPriorityTasks && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700 dark:text-yellow-400">Balancear Prioridades</p>
                        <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                          Tienes muchas tareas de alta prioridad. Considera delegar o reevaluar algunas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {insights.totalTasks === 0 && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">Comenzar es lo más importante</p>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                          Crea tu primera tarea para comenzar a trackear tu productividad.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}