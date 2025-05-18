"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  date: Date;
  time: string;
  project?: string;
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Reunión de equipo",
      date: new Date(2025, 4, 15),
      time: "10:00",
      project: "Proyecto A",
    },
    {
      id: "2",
      title: "Entrega de diseño",
      date: new Date(2025, 4, 18),
      time: "15:00",
      project: "Proyecto B",
    },
    {
      id: "3",
      title: "Llamada con cliente",
      date: new Date(2025, 4, 20),
      time: "11:30",
      project: "Proyecto A",
    },
  ]);

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
      return (
        event.date.getFullYear() === year &&
        event.date.getMonth() === month &&
        event.date.getDate() === day
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

  return (
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
              day === null ? "bg-transparent" : "hover:bg-secondary/20",
            )}
            data-oid=".y6p074"
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
                      title={`${event.title} - ${event.time}`}
                      data-oid="_yqc50j"
                    >
                      <span className="font-medium" data-oid="d.2xihp">
                        {event.time}
                      </span>{" "}
                      {event.title}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
