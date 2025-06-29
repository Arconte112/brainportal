"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/hooks/data-provider";
import { Event } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Tareas para el día seleccionado
type CalendarTask = { id: string; title: string; status: string; priority: string };
// Tareas del mes actual (incluye due_date)
type CalendarTaskMonthly = { id: string; title: string; status: string; priority: string; due_date: string };

export function Calendar() {
  const { events, loadingEvents } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<CalendarTaskMonthly[]>([]);
  const [isLoadingMonthData, setIsLoadingMonthData] = useState(true);
  const [isLoadingDayTasks, setIsLoadingDayTasks] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);

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
  // Al hacer click en un día, cargar tareas y eventos para mostrar modal
  const handleDayClick = async (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setIsLoadingDayTasks(true);
    
    // Obtener eventos del día seleccionado
    const dayEvents = getEventsForDay(day);
    setSelectedDateEvents(dayEvents);
    
    const dateStr = date.toISOString().substring(0, 10);
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority")
        .eq("due_date", dateStr)
        .order("due_date", { ascending: true });
      if (tasksError) {
        console.error("Error loading tasks:", tasksError);
        setTasks([]);
      } else {
        setTasks(tasksData ?? []);
      }
    } catch (error) {
      console.error("Error in handleDayClick:", error);
      setTasks([]);
    } finally {
      setIsLoadingDayTasks(false);
    }
  };

  // Cargar tareas del mes actual
  useEffect(() => {
    const loadTasksForMonth = async () => {
      setIsLoadingMonthData(true);
      try {
        const { data: tasksData, error } = await supabase
          .from("tasks")
          .select("id, title, status, priority, due_date")
          .gte("due_date", `${year}-${String(month + 1).padStart(2, '0')}-01`)
          .lt("due_date", `${year}-${String(month + 2).padStart(2, '0')}-01`)
          .order("due_date", { ascending: true });

        if (!error && tasksData) {
          setMonthlyTasks(tasksData);
        }
      } catch (error) {
        console.error("Error loading month tasks:", error);
        setMonthlyTasks([]);
      } finally {
        setIsLoadingMonthData(false);
      }
    };
    
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

  const getEventsForDay = (day: number): Event[] => {
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

        {isLoadingMonthData
          ? Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={`skel-day-${i}`} className="h-24 w-full rounded-md" data-oid="s1k2e3l4e5t6o7n8"/>
            ))
          : days.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "border border-border rounded-md min-h-24 p-1 relative",
                  day === null
                    ? "bg-transparent"
                    : "hover:bg-secondary/20 cursor-pointer",
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
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "text-xs p-1 border-l-2 rounded-sm truncate flex items-center gap-1",
                                  event.google_event_id 
                                    ? "border-blue-500 bg-blue-500/20" 
                                    : "border-white bg-secondary/30"
                                )}
                                data-oid="_yqc50j"
                              >
                                <span className="font-medium" data-oid="d.2xihp">
                                  {new Date(event.start_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                                </span>
                                {event.title}
                                {event.google_event_id && (
                                  <Cloud className="h-3 w-3 text-blue-500 ml-auto flex-shrink-0" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{event.title}</p>
                                <p className="text-xs">
                                  {new Date(event.start_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} - 
                                  {new Date(event.end_time).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                                </p>
                                {event.google_event_id && (
                                  <p className="text-xs text-blue-500">Sincronizado con Google Calendar</p>
                                )}
                                {event.sync_status === 'conflict' && (
                                  <p className="text-xs text-yellow-500">Conflicto de sincronización</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <div key={event.id} className="text-sm mb-2 p-2 rounded-md bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <strong>{new Date(event.start_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</strong>
                    {event.google_event_id && (
                      <Cloud className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <p>{event.title}</p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground">📍 {event.location}</p>
                  )}
                  {event.sync_status === 'conflict' && (
                    <p className="text-xs text-yellow-500 mt-1">⚠️ Conflicto de sincronización</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No hay eventos</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Tareas</h3>
            {isLoadingDayTasks ? (
              <div className="space-y-2" data-oid="l0a1d2i3n4g5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : tasks.length > 0 ? (
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
