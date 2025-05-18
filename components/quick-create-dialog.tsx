"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckSquare, FileText, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipo para los eventos
type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
};

// Datos de ejemplo para eventos
const SAMPLE_EVENTS: Event[] = [
  {
    id: "1",
    title: "Reunión de equipo",
    date: "2025-05-15",
    startTime: "10:00",
    endTime: "11:00",
    description: "Revisión semanal de proyectos",
  },
  {
    id: "2",
    title: "Llamada con cliente",
    date: "2025-05-15",
    startTime: "14:30",
    endTime: "15:30",
    description: "Presentación de avances",
  },
  {
    id: "3",
    title: "Revisión de diseño",
    date: "2025-05-16",
    startTime: "09:00",
    endTime: "10:30",
    description: "Feedback sobre nuevos mockups",
  },
  {
    id: "4",
    title: "Almuerzo con equipo",
    date: "2025-05-16",
    startTime: "13:00",
    endTime: "14:00",
  },
  {
    id: "5",
    title: "Planificación sprint",
    date: "2025-05-17",
    startTime: "11:00",
    endTime: "12:30",
    description: "Definición de tareas para el próximo sprint",
  },
];

// Generar horas del día (6am a 8pm)
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 6; // Empezar desde las 6am
  const hourFormatted = hour < 10 ? `0${hour}:00` : `${hour}:00`;
  const hourDisplay =
    hour < 12
      ? `${hour}:00 AM`
      : hour === 12
        ? `12:00 PM`
        : `${hour - 12}:00 PM`;
  return { value: hourFormatted, display: hourDisplay };
});

export function QuickCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("task");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<Event[]>(
    [],
  );

  // Actualizar eventos cuando cambia la fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      const filteredEvents = SAMPLE_EVENTS.filter(
        (event) => event.date === selectedDate,
      );
      setEventsForSelectedDate(filteredEvents);
    }
  }, [selectedDate]);

  // Función para verificar si hay un evento en una hora específica
  const getEventAtHour = (hour: string) => {
    return eventsForSelectedDate.filter((event) => {
      // Convertir horas a minutos para comparación más fácil
      const hourMinutes = convertTimeToMinutes(hour);
      const startMinutes = convertTimeToMinutes(event.startTime);
      const endMinutes = convertTimeToMinutes(event.endTime);

      // Verificar si la hora está dentro del rango del evento
      return hourMinutes >= startMinutes && hourMinutes < endMinutes;
    });
  };

  // Convertir hora (HH:MM) a minutos
  const convertTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Generar opciones de tiempo (cada 30 minutos)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
        const formattedMinute = minute === 0 ? "00" : `${minute}`;
        const value = `${formattedHour}:${formattedMinute}`;
        const display =
          hour < 12
            ? `${hour}:${formattedMinute} AM`
            : hour === 12
              ? `12:${formattedMinute} PM`
              : `${hour - 12}:${formattedMinute} PM`;
        options.push({ value, display });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="esuo7i_">
      <DialogContent className="sm:max-w-[500px] bg-card" data-oid="4cglut6">
        <DialogHeader data-oid="juwb-np">
          <DialogTitle data-oid="wy54b9c">Crear Rápido</DialogTitle>
        </DialogHeader>
        <Tabs
          defaultValue="task"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          data-oid="wgl419b"
        >
          <TabsList className="grid grid-cols-3 mb-4" data-oid="6i1aavz">
            <TabsTrigger
              value="task"
              className="flex items-center gap-1"
              data-oid="53tknm6"
            >
              <CheckSquare className="h-4 w-4" data-oid="sdbg7ky" />
              <span data-oid="pscvorm">Tarea</span>
            </TabsTrigger>
            <TabsTrigger
              value="event"
              className="flex items-center gap-1"
              data-oid=".6wszwq"
            >
              <CalendarIcon className="h-4 w-4" data-oid="5ck425j" />
              <span data-oid="9hil5ge">Evento</span>
            </TabsTrigger>
            <TabsTrigger
              value="note"
              className="flex items-center gap-1"
              data-oid="88ix96z"
            >
              <FileText className="h-4 w-4" data-oid="bstwt:w" />
              <span data-oid="9oho_o6">Nota</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="task" className="space-y-4" data-oid="ti3urkm">
            <div className="space-y-2" data-oid="p.bcbv1">
              <Input placeholder="Título de la tarea" data-oid="mm-5b.f" />
              <Textarea
                placeholder="Descripción (opcional)"
                rows={3}
                data-oid="0ozf4s."
              />
            </div>
            <div className="flex justify-end" data-oid="j4hxd.k">
              <Button type="submit" data-oid="35y8xfn">
                Crear Tarea
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="event" className="space-y-4" data-oid="qyyw_j1">
            <div className="space-y-2" data-oid="ruvhek5">
              <Input placeholder="Título del evento" data-oid="24qvlwj" />
              <div className="grid grid-cols-1 gap-2" data-oid="vqj0g38">
                <div data-oid="bg7.7kl">
                  <label
                    htmlFor="event-date"
                    className="text-sm text-muted-foreground mb-1 block"
                    data-oid="wdzn6t4"
                  >
                    Fecha
                  </label>
                  <Input
                    id="event-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    data-oid="sh2hhez"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2" data-oid="ihhb1h8">
                  <div data-oid="q92pbvn">
                    <label
                      htmlFor="start-time"
                      className="text-sm text-muted-foreground mb-1 block"
                      data-oid="yp7cwe:"
                    >
                      Hora inicio
                    </label>
                    <Select
                      value={startTime}
                      onValueChange={setStartTime}
                      data-oid="mr0phxo"
                    >
                      <SelectTrigger id="start-time" data-oid="6:qndat">
                        <SelectValue
                          placeholder="Hora inicio"
                          data-oid="we5anan"
                        />
                      </SelectTrigger>
                      <SelectContent data-oid="mj4fj8p">
                        {timeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            data-oid="fozhspl"
                          >
                            {option.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div data-oid="bgvaj-0">
                    <label
                      htmlFor="end-time"
                      className="text-sm text-muted-foreground mb-1 block"
                      data-oid=":2vlc37"
                    >
                      Hora fin
                    </label>
                    <Select
                      value={endTime}
                      onValueChange={setEndTime}
                      data-oid="yd19fvr"
                    >
                      <SelectTrigger id="end-time" data-oid=".e-x328">
                        <SelectValue
                          placeholder="Hora fin"
                          data-oid="5n.zoq-"
                        />
                      </SelectTrigger>
                      <SelectContent data-oid="yp69ysu">
                        {timeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={
                              convertTimeToMinutes(option.value) <=
                              convertTimeToMinutes(startTime)
                            }
                            data-oid=".84mbx7"
                          >
                            {option.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Descripción (opcional)"
                rows={3}
                data-oid="7h..pmv"
              />

              {/* Lista de eventos del día seleccionado */}
              <div className="mt-4" data-oid="228_kk7">
                <h3 className="text-sm font-medium mb-2" data-oid="k5vqd8g">
                  Eventos para{" "}
                  {new Date(selectedDate).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <div
                  className="border border-border rounded-md overflow-hidden max-h-[200px] overflow-y-auto"
                  data-oid="3bfhss2"
                >
                  <div className="divide-y divide-border" data-oid="2v.oxo-">
                    {HOURS.map((hour) => {
                      const eventsAtHour = getEventAtHour(hour.value);
                      return (
                        <div
                          key={hour.value}
                          className={`flex items-center p-2 text-sm ${
                            eventsAtHour.length > 0 ? "bg-secondary/30" : ""
                          }`}
                          data-oid="_4-dz0m"
                        >
                          <div className="w-16 font-medium" data-oid="nnbuf07">
                            {hour.display}
                          </div>
                          <div className="flex-1" data-oid="t9vui:-">
                            {eventsAtHour.length > 0 ? (
                              eventsAtHour.map((event) => (
                                <div
                                  key={event.id}
                                  className="ml-2"
                                  data-oid="dpmynhd"
                                >
                                  <div
                                    className="flex items-center gap-1"
                                    data-oid="tbpd8l6"
                                  >
                                    <Clock
                                      className="h-3 w-3 text-muted-foreground"
                                      data-oid="kt611sh"
                                    />

                                    <span
                                      className="text-xs text-muted-foreground"
                                      data-oid="a4iwhgl"
                                    >
                                      {event.startTime} - {event.endTime}
                                    </span>
                                  </div>
                                  <div
                                    className="font-medium"
                                    data-oid="g24augn"
                                  >
                                    {event.title}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div
                                className="text-muted-foreground text-xs ml-2"
                                data-oid=":oy9ivo"
                              >
                                Disponible
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end" data-oid="sqs3gq9">
              <Button type="submit" data-oid="w6jw:hc">
                Crear Evento
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="note" className="space-y-4" data-oid="l7bi6f1">
            <div className="space-y-2" data-oid="7nye_:v">
              <Input placeholder="Título de la nota" data-oid="ff52z.y" />
              <Textarea placeholder="Contenido" rows={5} data-oid="8rkeqdw" />
            </div>
            <div className="flex justify-end" data-oid="wo8c_b9">
              <Button type="submit" data-oid="73re1nh">
                Crear Nota
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
