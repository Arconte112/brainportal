"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useData } from "@/hooks/data-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ReminderDialog } from "@/components/reminder-dialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { Plus, Bell, Clock, CheckCircle, X, Volume2, VolumeX } from "lucide-react";
import type { Reminder } from "@/types";
import { logger } from "@/lib/logger";

export default function RemindersPage() {
  const {
    reminders,
    loadingReminders,
    updateReminderOptimistic,
    addReminderOptimistic,
    removeReminderOptimistic,
  } = useData();


  const handleReminderTriggered = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "completed" })
        .eq("id", reminderId);

      if (error) {
        logger.error("Error marking reminder as completed", error, "RemindersPage");
        return;
      }

      updateReminderOptimistic(reminderId, { status: "completed" });
    } catch (error) {
      logger.error("Error updating reminder", error, "RemindersPage");
    }
  };

  const {
    permission,
    requestPermission,
    scheduleReminder,
    scheduleMultipleReminders,
    playNotificationSound,
  } = useNotifications({
    onReminderTriggered: handleReminderTriggered,
  });

  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [isNewReminder, setIsNewReminder] = useState(false);

  // Request notification permission on component mount
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Schedule active reminders when component mounts or reminders change
  useEffect(() => {
    const activeReminders = reminders.filter(r => r.status === "pending");
    scheduleMultipleReminders(activeReminders);
  }, [reminders, scheduleMultipleReminders]);

  const handleCreateReminder = () => {
    setSelectedReminder(null);
    setIsNewReminder(true);
    setReminderDialogOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setIsNewReminder(false);
    setReminderDialogOpen(true);
  };

  const handleSaveReminder = async (reminder: Reminder) => {
    setReminderDialogOpen(false);

    if (isNewReminder) {
      try {
        const { data, error } = await supabase
          .from("reminders")
          .insert({
            title: reminder.title,
            description: reminder.description || null,
            date_time: reminder.dateTime,
            status: reminder.status,
            sound_enabled: reminder.soundEnabled ?? true,
          })
          .select("*")
          .single();

        if (error) {
          logger.error("Error creating reminder", error, "RemindersPage");
          toast({
            title: "Error",
            description: "No se pudo crear el recordatorio",
            variant: "destructive",
          });
          return;
        }

        const newReminder: Reminder = {
          id: data.id,
          title: data.title,
          description: data.description || undefined,
          dateTime: data.date_time,
          status: data.status,
          soundEnabled: data.sound_enabled ?? true,
        };

        addReminderOptimistic(newReminder);
        scheduleReminder(newReminder);

        toast({
          title: "Recordatorio creado",
          description: `"${reminder.title}" se programó correctamente`,
        });
      } catch (error) {
        logger.error("Error creating reminder", error, "RemindersPage");
        toast({
          title: "Error",
          description: "Error inesperado al crear el recordatorio",
          variant: "destructive",
        });
      }
    } else {
      // Update existing reminder
      try {
        const { error } = await supabase
          .from("reminders")
          .update({
            title: reminder.title,
            description: reminder.description || null,
            date_time: reminder.dateTime,
            status: reminder.status,
            sound_enabled: reminder.soundEnabled ?? true,
          })
          .eq("id", reminder.id);

        if (error) {
          logger.error("Error updating reminder", error, "RemindersPage");
          toast({
            title: "Error",
            description: "No se pudo actualizar el recordatorio",
            variant: "destructive",
          });
          return;
        }

        updateReminderOptimistic(reminder.id, reminder);
        scheduleReminder(reminder);

        toast({
          title: "Recordatorio actualizado",
          description: `"${reminder.title}" se actualizó correctamente`,
        });
      } catch (error) {
        logger.error("Error updating reminder", error, "RemindersPage");
        toast({
          title: "Error",
          description: "Error inesperado al actualizar el recordatorio",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkCompleted = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "completed" })
        .eq("id", reminderId);

      if (error) {
        logger.error("Error marking reminder as completed", error, "RemindersPage");
        toast({
          title: "Error",
          description: "No se pudo marcar como completado",
          variant: "destructive",
        });
        return;
      }

      updateReminderOptimistic(reminderId, { status: "completed" });
      toast({
        title: "Recordatorio completado",
        description: "El recordatorio se marcó como completado",
      });
    } catch (error) {
      logger.error("Error updating reminder", error, "RemindersPage");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId);

      if (error) {
        logger.error("Error deleting reminder", error, "RemindersPage");
        toast({
          title: "Error",
          description: "No se pudo eliminar el recordatorio",
          variant: "destructive",
        });
        return;
      }

      removeReminderOptimistic(reminderId);
      toast({
        title: "Recordatorio eliminado",
        description: "El recordatorio se eliminó correctamente",
      });
    } catch (error) {
      logger.error("Error deleting reminder", error, "RemindersPage");
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingReminders) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Recordatorios</h1>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="task-card animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const completedReminders = reminders.filter(r => r.status === "completed");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recordatorios</h1>
          </div>
          <Button size="sm" onClick={handleCreateReminder}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Recordatorio
          </Button>
        </div>

        {permission !== "granted" && (
          <div className="bg-secondary/20 rounded-md p-4 border border-border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <div className="flex-1">
                <h3 className="font-medium">Permisos de notificación requeridos</h3>
                <p className="text-sm text-muted-foreground">
                  Para recibir recordatorios con sonido, necesitas permitir las notificaciones.
                </p>
              </div>
              <Button onClick={requestPermission} variant="outline" size="sm">
                Permitir Notificaciones
              </Button>
            </div>
          </div>
        )}

        {permission === "granted" && (
          <div className="bg-secondary/20 rounded-md p-4 border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              <div className="flex-1">
                <h3 className="font-medium">Notificaciones habilitadas</h3>
                <p className="text-sm text-muted-foreground">
                  Recibirás notificaciones con sonido cuando se activen tus recordatorios.
                </p>
              </div>
              <Button
                onClick={() => {
                  const testNotification = new Notification("Prueba de notificación", {
                    body: "Esta es una notificación de prueba",
                    icon: "/placeholder-logo.png",
                    requireInteraction: true,
                  });
                  playNotificationSound();
                }}
                variant="outline"
                size="sm"
              >
                Probar Sonido
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Pending Reminders */}
          <div>
            <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pendientes ({pendingReminders.length})
            </h2>
            {pendingReminders.length === 0 ? (
              <div className="bg-secondary/20 rounded-md p-4 border border-border text-center text-muted-foreground">
                No tienes recordatorios pendientes
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReminders.map((reminder) => (
                  <div key={reminder.id} className="task-card cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">
                          {reminder.title}
                          {reminder.soundEnabled ? (
                            <Volume2 className="h-4 w-4 inline ml-2 text-muted-foreground" title="Sonido activado" />
                          ) : (
                            <VolumeX className="h-4 w-4 inline ml-2 text-muted-foreground" title="Sonido desactivado" />
                          )}
                        </p>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reminder.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(reminder.dateTime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditReminder(reminder)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMarkCompleted(reminder.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completados ({completedReminders.length})
              </h2>
              <div className="space-y-2">
                {completedReminders.map((reminder) => (
                  <div key={reminder.id} className="task-card opacity-75 group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{reminder.title}</p>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reminder.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(reminder.dateTime)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ReminderDialog
          reminder={selectedReminder}
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          onSave={handleSaveReminder}
          isNew={isNewReminder}
        />
      </div>
    </AppLayout>
  );
}