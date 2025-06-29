"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSelectedDate } from "@/hooks/use-selected-date";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { ChatBot } from "./chat-bot";
import { SidebarProvider } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


// Tipo de evento para la lista de Eventos de hoy y Próximos eventos
type EventItem = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  priority: string;
};

// Tipo para el evento seleccionado en el modal, incluye descripción
type FullEventItem = EventItem & {
  description?: string | null; // Description can be optional or null
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [todayEvents, setTodayEvents] = useState<EventItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loadingTodayEvents, setLoadingTodayEvents] = useState(true);
  const [loadingUpcomingEvents, setLoadingUpcomingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<FullEventItem | null>(
    null
  );

  const { selectedDate } = useSelectedDate();

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === " " &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setChatOpen(true);
      }
      if (
        e.key === "c" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        logger.debug("Quick create triggered", null, 'AppLayout');
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cargar eventos para la fecha seleccionada
  const loadTodayEvents = async () => {
    setLoadingTodayEvents(true);
    try {
      if (!selectedDate) {
        setTodayEvents([]); // Clear events if no date is selected
        return;
      }
      // Calcular ventana UTC que cubre el día local seleccionado,
      // ajustando por la zona horaria para incluir eventos almacenados en UTC
      const [year, month, day] = selectedDate.split('-').map(Number);
      const localStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const offsetMs = localStart.getTimezoneOffset() * 60000;
      const utcStart = new Date(localStart.getTime() - offsetMs).toISOString();
      const utcEnd = new Date(localStart.getTime() + 24 * 60 * 60 * 1000 - offsetMs).toISOString();
      const { data: todayData, error } = await supabase
        .from("events")
        .select("id, title, start_time, end_time, priority")
        .gte("start_time", utcStart)
        .lt("start_time", utcEnd)
        .order("start_time", { ascending: true });
      if (error) logger.error("Error loading today events", error, 'AppLayout');
      else setTodayEvents(todayData ?? []);
    } finally {
      setLoadingTodayEvents(false);
    }
  };

  useEffect(() => {
    loadTodayEvents();
  }, [selectedDate]);

  // Cargar próximos eventos
  const loadUpcomingEvents = async () => {
    setLoadingUpcomingEvents(true);
    try {
      const now = new Date();
      const { data: upcomingData, error } = await supabase
        .from("events")
        .select("id, title, start_time, end_time, priority")
        .gt("start_time", now.toISOString())
        .order("start_time", { ascending: true })
        .limit(5);
      if (error) logger.error("Error loading upcoming events", error, 'AppLayout');
      else setUpcomingEvents(upcomingData ?? []);
    } finally {
      setLoadingUpcomingEvents(false);
    }
  };

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  // Función para convertir formato 24h a 12h
  const formatTo12Hour = (time24h: string) => {
    const [hours, minutes] = time24h.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleEventClick = async (eventId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, start_time, end_time, priority")
      .eq("id", eventId)
      .single();

    if (error) {
      logger.error("Error fetching event details", error, 'AppLayout');
      return;
    }
    if (data) {
      setSelectedEvent(data as FullEventItem);
    }
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent) return;

    const eventToSave = {
      title: selectedEvent.title,
      description: selectedEvent.description,
      start_time: selectedEvent.start_time,
      end_time: selectedEvent.end_time,
      priority: selectedEvent.priority,
    };

    const { error } = await supabase
      .from("events")
      .update(eventToSave)
      .eq("id", selectedEvent.id);

    if (error) {
      logger.error("Error updating event", error, 'AppLayout');
    } else {
      setSelectedEvent(null);
      await loadTodayEvents(); // Refresh today's events
      await loadUpcomingEvents(); // Refresh upcoming events
    }
  };

  // Helper function to format date for datetime-local input
  // It ensures the date displayed is in the user's local timezone
  const formatForDateTimeLocal = (isoString: string | undefined | null) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      // Create a new date shifted by the timezone offset to display correctly in local time
      const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().substring(0, 16);
    } catch (e) {
      logger.error("Error formatting date for input", e, 'AppLayout');
      return ""; // Fallback to empty string if date is invalid
    }
  };


  return (
    <SidebarProvider defaultOpen={!focusMode} data-oid="oon9mc7">
      <div className="flex h-screen w-full overflow-hidden" data-oid="v6ncc1t">
        {!focusMode && <AppSidebar data-oid="5._alww" />}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          data-oid="3frp.wq"
        >
          {!focusMode && (
            <TopBar
              onToggleFocus={() => setFocusMode(!focusMode)}
              data-oid="nwj5:p0"
            />
          )}
          <main
            className="flex-1 overflow-auto p-4 bg-background"
            data-oid="9p8cyrg"
          >
            <div
              className="grid grid-cols-1 lg:grid-cols-4 gap-4"
              data-oid="n4ydimt"
            >
              <div className="lg:col-span-3" data-oid="mvrtzdh">
                {children}
              </div>
              <div
                className="bg-card rounded-md border border-border p-4"
                data-oid="-ndvpw1"
              >
                <Tabs
                  defaultValue="today"
                  className="w-full"
                  data-oid="zuecfz7"
                >
                  <TabsList
                    className="grid w-full grid-cols-2 mb-3"
                    data-oid="g:335lm"
                  >
                    <TabsTrigger value="today" data-oid="6hb.okt">
                      Eventos de hoy
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" data-oid="hqqbvq7">
                      Próximos eventos
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="today"
                    className="space-y-3 max-h-[400px] overflow-y-auto"
                    data-oid="2t318:r"
                  >
                    {loadingTodayEvents ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 p-2">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : todayEvents.length > 0 ? (
                      todayEvents.map((event) => {
                        const start = new Date(event.start_time);
                        const end = new Date(event.end_time);
                        const startStr = `${start
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${start
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                        const endStr = `${end
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${end
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 p-2 hover:bg-secondary/20 rounded-md cursor-pointer"
                            data-oid="ti3ln6v"
                            onClick={() => handleEventClick(event.id)}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                event.priority === "high"
                                  ? "bg-destructive"
                                  : event.priority === "medium"
                                  ? "bg-white" // Consider a more visible color like bg-yellow-400
                                  : "bg-muted-foreground"
                              }`}
                              data-oid="x27kulr"
                            />
                            <div className="flex-1" data-oid="qt5g3w6">
                              <p className="text-sm font-medium" data-oid="_fqm-km">
                                {event.title}
                              </p>
                              <p
                                className="text-xs text-muted-foreground"
                                data-oid="7esbbz:"
                              >
                                {formatTo12Hour(startStr)} - {formatTo12Hour(endStr)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4" data-oid="2.mnfie">
                        <p
                          className="text-sm text-muted-foreground"
                          data-oid="atpplyv"
                        >
                          No hay eventos para hoy
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent
                    value="upcoming"
                    className="space-y-3 max-h-[400px] overflow-y-auto"
                    data-oid="l:zq_cw"
                  >
                    {loadingUpcomingEvents ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 p-2">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => {
                        const start = new Date(event.start_time);
                        const end = new Date(event.end_time);
                        const dateLabel = start.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        });
                        const startStr = `${start
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${start
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                        const endStr = `${end
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${end
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}`;
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 p-2 hover:bg-secondary/20 rounded-md cursor-pointer"
                            data-oid="y-.wn__"
                            onClick={() => handleEventClick(event.id)}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                event.priority === "high"
                                  ? "bg-destructive"
                                  : event.priority === "medium"
                                  ? "bg-white" // Consider a more visible color
                                  : "bg-muted-foreground"
                              }`}
                              data-oid="j3n1gyf"
                            />
                            <div className="flex-1" data-oid="-x.jb8l">
                              <p className="text-sm font-medium" data-oid="vj03qzs">
                                {event.title}
                              </p>
                              <p
                                className="text-xs text-muted-foreground"
                                data-oid="aa3tewu"
                              >
                                {dateLabel}, {formatTo12Hour(startStr)} - {formatTo12Hour(endStr)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4" data-oid="2.mnfie">
                        <p
                          className="text-sm text-muted-foreground"
                          data-oid="atpplyv"
                        >
                          No hay próximos eventos
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
          <Dialog
            open={!!selectedEvent}
            onOpenChange={(open) => {
              if (!open) setSelectedEvent(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalles del evento</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSaveEvent();
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={selectedEvent?.title || ""}
                    onChange={(e) =>
                      setSelectedEvent((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={selectedEvent?.description || ""}
                    onChange={(e) =>
                      setSelectedEvent((prev) =>
                        prev
                          ? { ...prev, description: e.target.value }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="start_time">Inicio</Label>
                  <Input
                    type="datetime-local"
                    id="start_time"
                    value={formatForDateTimeLocal(selectedEvent?.start_time)}
                    onChange={(e) =>
                      setSelectedEvent((prev) =>
                        prev
                          ? {
                              ...prev,
                              start_time: new Date(
                                e.target.value
                              ).toISOString(),
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="end_time">Fin</Label>
                  <Input
                    type="datetime-local"
                    id="end_time"
                    value={formatForDateTimeLocal(selectedEvent?.end_time)}
                    onChange={(e) =>
                      setSelectedEvent((prev) =>
                        prev
                          ? {
                              ...prev,
                              end_time: new Date(
                                e.target.value
                              ).toISOString(),
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={selectedEvent?.priority || ""}
                    onValueChange={(value) =>
                      setSelectedEvent((prev) =>
                        prev ? { ...prev, priority: value } : prev
                      )
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <ChatBot
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            data-oid="l_-u2a."
          />
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-6 right-6 bg-accent text-white rounded-full p-3 shadow-md hover:bg-accent/80 transition-colors duration-150"
              title="Open Brain (Space)"
              data-oid="-5lt.:2"
            >
              <BrainIcon className="h-6 w-6" data-oid="1cu9w5h" />
              <span className="sr-only" data-oid="o:3i43r">
                Open Brain
              </span>
            </button>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      data-oid="6cn0.xh"
    >
      <path
        d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 0 19.5v-15A2.5 2.5 0 0 1 2.5 2h7z"
        data-oid="5_2ex1l"
      />
      <path
        d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 2.5 2.5h7a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 21.5 2h-7z"
        data-oid="21t7d19"
      />
      <path d="M6 12h4" data-oid="qq-vroz" />
      <path d="M14 12h4" data-oid="qbk.-c1" />
      <path d="M6 8h4" data-oid="9th7emh" />
      <path d="M14 8h4" data-oid="j5nt5ab" />
      <path d="M6 16h4" data-oid="dw0zi76" />
      <path d="M14 16h4" data-oid="-gtp37c" />
    </svg>
  );
}
