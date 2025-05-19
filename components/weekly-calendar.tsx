"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  // Lista de tareas cargadas en Dashboard
  tasks: { id: string; title: string; dueDate?: string; status: string }[];
}
export function WeeklyCalendar({ selectedDate, onSelectDate, tasks }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Mapa de tareas por fecha (YYYY-MM-DD)
  const [tasksByDate, setTasksByDate] = useState<Record<string, { id: string; title: string }[]>>({});

  // Generate week days starting from Monday of the current week
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  // Construir mapa de tareas por fecha a partir de las tareas pasadas como prop
  useEffect(() => {
    const map: Record<string, { id: string; title: string }[]> = {};
    tasks.forEach((t) => {
      if (t.status !== "pending" || !t.dueDate) return;
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push({ id: t.id, title: t.title });
    });
    setTasksByDate(map);
  }, [tasks]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="border border-border rounded-md p-3 bg-secondary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Esta semana</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={prevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Semana anterior</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={nextWeek}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Semana siguiente</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weekDays.map((date) => {
          // Calcular clave de fecha en formato YYYY-MM-DD según zona local
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          const tasksForDay = tasksByDate[dateKey] || [];
          const isSelected = dateKey === selectedDate;
          return (
            <div
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "flex-shrink-0 w-14 h-14 flex flex-col items-center justify-center rounded-md border border-border",
                isToday(date)
                  ? "bg-accent text-white"
                  : isSelected
                  ? "bg-accent/50 text-accent-foreground"
                  : "hover:bg-secondary/50 cursor-pointer",
              )}
            >
              <span className="text-xs text-muted-foreground">
                {date.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <span className="text-sm font-medium">{date.getDate()}</span>
              {tasksForDay.length > 0 && (
                <span className="mt-1 text-[10px] bg-accent text-accent-foreground px-1 rounded">
                  {tasksForDay.length}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
