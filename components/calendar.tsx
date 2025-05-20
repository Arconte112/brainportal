"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Evento para el calendario extraído de Supabase
type CalendarEvent = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  priority: string;
};
// Tareas para el día seleccionado
type CalendarTask = { id: string; title: string; status: string; priority: string };
// Tareas del mes actual (incluye due_date)
type CalendarTaskMonthly = { id: string; title: string; status: string; priority: string; due_date: string };

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<CalendarTaskMonthly[]>([]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const today = new Date();
  // Al hacer click en un día, cargar tareas y mostrar modal
  const handleDayClick = async (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().substring(0, 10);
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, status, priority")
      .eq("due_date", dateStr)
      .order("due_date", { ascending: true });
    if (tasksError) console.error("Error loading tasks:", tasksError);
    else setTasks(tasksData ?? []);
    setSelectedDate(date);
  };

  // Cargar eventos y tareas desde Supabase para el mes actual
  useEffect(() => {
    const loadEventsForMonth = async () => {
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 1);
      endOfMonth.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_time, end_time, priority")
        .gte("start_time", startOfMonth.toISOString())
        .lt("start_time", endOfMonth.toISOString())
        .order("start_time", { ascending: true });
      if (error) console.error("Error loading calendar events:", error);
      else setEvents(data ?? []);
    };

    const loadTasksForMonth = async () => {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .gte("due_date", startStr)
        .lt("due_date", endStr)
        .order("due_date", { ascending: true });
      if (tasksError) console.error("Error loading calendar tasks:", tasksError);
      else setMonthlyTasks(tasksData ?? []);
    };

    loadEventsForMonth();
    loadTasksForMonth();
  }, [year, month]);

  // Adjust for Sunday as first day (0) to Monday as first day (1)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null); // Empty cells for days before the first day of the month
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const d = new Date(event.start_time);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };
  const getTasksCountForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthlyTasks.filter((task) => task.due_date === dateStr).length;
  };

  return (
    <>
      <div className="space-y-6" data-oid="lppnehe">
      <div className="flex items-center justify-between" data-oid="nb7djnn">
        <h1 className="text-2xl font-bold" data-oid="kfaxavi">
          Calendario
        </h1>
        <div className="flex items-center gap-2" data-oid="wmvcnm4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            data-oid="38me9xe"
          >
            <ChevronLeft className="h-4 w-4" data-oid="0zximgj" />
          </Button>
          <h2
            className="text-lg font-medium min-w-32 text-center"
            data-oid="flc7cqk"
          >
            {currentDate.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            data-oid="gz_u1jt"
          >
            <ChevronRight className="h-4 w-4" data-oid="6:y-syr" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" data-oid=".b3sa2g">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-muted-foreground"
            data-oid="_cc8ujr"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "border border-border rounded-md min-h-24 p-1 relative",
              day === null ? "bg-transparent" : "hover:bg-secondary/20 cursor-pointer",
            )}
            data-oid=".y6p074"
            onClick={() => day !== null && handleDayClick(day)}
          >
            {day !== null && (
              <>
                <div
                  className={cn(
                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-white text-black" : "",
                  )}
                  data-oid=":.:-.du"
                >
                  {day}
                </div>
                <div className="mt-1 space-y-1" data-oid="hvh:eul">
                  {getEventsForDay(day).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 border-l-2 border-white bg-secondary/30 rounded-sm truncate"
                      title={`${event.title} - ${new Date(event.start_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`}
                      data-oid="_yqc50j"
                    >
                      <span className="font-medium" data-oid="d.2xihp">
                        {new Date(event.start_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                      </span>{" "}
                      {event.title}
                    </div>
                  ))}
                </div>
                {getTasksCountForDay(day) > 0 && (
                  <Badge className="absolute bottom-1 right-1">
                    {getTasksCountForDay(day)}
                  </Badge>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
    <Dialog
      open={!!selectedDate}
      onOpenChange={(open) => { if (!open) setSelectedDate(null); }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Detalles de {selectedDate?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Eventos</h3>
            {selectedDate && getEventsForDay(selectedDate.getDate()).length > 0 ? (
              getEventsForDay(selectedDate.getDate()).map((event) => (
                <div key={event.id} className="text-sm mb-1">
                  <strong>{new Date(event.start_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong> - {event.title}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No hay eventos</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Tareas</h3>
            {tasks.length > 0 ? (
              tasks.map((task) => <div key={task.id} className="text-sm mb-1">{task.title}</div>)
            ) : (
              <p className="text-xs text-muted-foreground">No hay tareas</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Cerrar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
