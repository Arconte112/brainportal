"use client";

import React, { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { ChatBot } from "./chat-bot";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to open chatbot
      if (
        e.key === " " &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setChatOpen(true);
      }

      // C to open quick create
      if (
        e.key === "c" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        // Handle quick create
        console.log("Quick create");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Función para convertir formato 24h a 12h
  const formatTo12Hour = (time24h: string) => {
    const [hours, minutes] = time24h.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convertir 0 a 12 para medianoche
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
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
                    {[
                      {
                        id: 1,
                        title: "Reunión de equipo",
                        startTime: "15:00",
                        endTime: "16:30",
                        priority: "high",
                      },
                      {
                        id: 2,
                        title: "Revisión de diseño",
                        startTime: "17:30",
                        endTime: "18:00",
                        priority: "medium",
                      },
                      {
                        id: 3,
                        title: "Llamada con cliente",
                        startTime: "10:00",
                        endTime: "11:00",
                        priority: "low",
                      },
                      {
                        id: 4,
                        title: "Planificación sprint",
                        startTime: "12:30",
                        endTime: "13:30",
                        priority: "high",
                      },
                    ].map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 p-2 hover:bg-secondary/20 rounded-md cursor-pointer"
                        data-oid="ti3ln6v"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.priority === "high"
                              ? "bg-destructive"
                              : event.priority === "medium"
                                ? "bg-white"
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
                            {formatTo12Hour(event.startTime)} -{" "}
                            {formatTo12Hour(event.endTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Si no hay eventos hoy */}
                    {false && (
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
                    {[
                      {
                        id: 3,
                        title: "Entrega de diseño",
                        date: "Mañana",
                        startTime: "10:00",
                        endTime: "11:00",
                        priority: "medium",
                      },
                      {
                        id: 4,
                        title: "Llamada con cliente",
                        date: "20 Mayo",
                        startTime: "11:30",
                        endTime: "12:30",
                        priority: "low",
                      },
                      {
                        id: 5,
                        title: "Revisión de sprint",
                        date: "22 Mayo",
                        startTime: "09:00",
                        endTime: "10:30",
                        priority: "high",
                      },
                      {
                        id: 6,
                        title: "Presentación de proyecto",
                        date: "25 Mayo",
                        startTime: "14:00",
                        endTime: "15:30",
                        priority: "high",
                      },
                      {
                        id: 7,
                        title: "Reunión de equipo",
                        date: "27 Mayo",
                        startTime: "10:00",
                        endTime: "11:00",
                        priority: "medium",
                      },
                      {
                        id: 8,
                        title: "Taller de UX",
                        date: "1 Junio",
                        startTime: "09:30",
                        endTime: "13:00",
                        priority: "medium",
                      },
                    ].map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 p-2 hover:bg-secondary/20 rounded-md cursor-pointer"
                        data-oid="y-.wn__"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.priority === "high"
                              ? "bg-destructive"
                              : event.priority === "medium"
                                ? "bg-white"
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
                            {event.date}, {formatTo12Hour(event.startTime)} -{" "}
                            {formatTo12Hour(event.endTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
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
