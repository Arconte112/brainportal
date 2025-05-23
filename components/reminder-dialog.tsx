"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Bell } from "lucide-react";
import type { Reminder } from "@/types";

interface ReminderDialogProps {
  reminder?: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: Reminder) => void;
  isNew?: boolean;
}

export function ReminderDialog({
  reminder,
  open,
  onOpenChange,
  onSave,
  isNew = false,
}: ReminderDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description || "");
      setSoundEnabled(reminder.soundEnabled ?? true);
      
      if (reminder.dateTime) {
        const dateTime = new Date(reminder.dateTime);
        setDate(dateTime.toISOString().split('T')[0]);
        setTime(dateTime.toTimeString().slice(0, 5));
      }
    } else if (isNew) {
      // Set default values for new reminder
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5); // Default to 5 minutes from now
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setTitle("");
      setDescription("");
      setSoundEnabled(true);
    }
  }, [reminder, isNew]);

  const handleSave = () => {
    if (!title.trim() || !date || !time) return;

    const dateTime = new Date(`${date}T${time}`);
    
    const reminderData: Reminder = {
      id: reminder?.id || `reminder-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      dateTime: dateTime.toISOString(),
      status: reminder?.status || "pending",
      soundEnabled,
    };

    onSave(reminderData);
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return "";
    
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    return dateTime.toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {isNew ? "Nuevo Recordatorio" : "Editar Recordatorio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="¿Qué quieres recordar?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Agrega más detalles..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {date && time && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Recordatorio programado para:</strong><br />
              {formatDateTime(date, time)}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sound" className="text-sm font-medium">
                Reproducir sonido
              </Label>
              <p className="text-xs text-muted-foreground">
                Se reproducirá un sonido cuando se active el recordatorio
              </p>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !date || !time}
            >
              {isNew ? "Crear Recordatorio" : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}