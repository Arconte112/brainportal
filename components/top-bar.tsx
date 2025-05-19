"use client";
import { TIME_ZONE } from "@/lib/utils";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import { QuickCreateDialog } from "./quick-create-dialog";

export function TopBar({ onToggleFocus }: { onToggleFocus: () => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentTime);

  const formattedTime = new Intl.DateTimeFormat("es-ES", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(currentTime);

  const toggleFocus = () => {
    setFocusMode(!focusMode);
    onToggleFocus();
  };

  return (
    <div className="h-12 border-b border-border flex items-center justify-between px-4">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-white">{formattedTime}</span>
        <span className="mx-2">•</span>
        <span>{formattedDate}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFocus}
          className="text-muted-foreground hover:text-white"
          title={focusMode ? "Salir del modo enfoque" : "Modo enfoque"}
        >
          {focusMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={() => setQuickCreateOpen(true)}
          size="sm"
          className="bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4 mr-1" /> Rápido
        </Button>
      </div>
      <QuickCreateDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
      />
    </div>
  );
}
