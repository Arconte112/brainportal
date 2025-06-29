"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, RefreshCw, Link, Unlink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoogleCalendar } from "@/types";

interface GoogleCalendarStatus {
  connected: boolean;
  config: {
    id: string;
    sync_enabled: boolean;
    sync_interval_minutes: number;
    last_sync: string | null;
    calendar_count: number;
    sync_stats: {
      synced_events: number;
      pending_events: number;
      error_events: number;
      conflict_events: number;
    } | null;
  } | null;
}

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingCalendars, setFetchingCalendars] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/auth/google/status");
      const data = await response.json();
      setStatus(data);
      
      if (data.connected) {
        await fetchCalendars();
      }
    } catch (error) {
      console.error("Error fetching status:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el estado de Google Calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch("/api/calendar/calendars");
      const data = await response.json();
      if (data.success) {
        setCalendars(data.calendars);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/auth/google/login";
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Estás seguro de que quieres desconectar Google Calendar?")) {
      return;
    }

    try {
      const response = await fetch("/api/auth/google/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Desconectado",
          description: "Google Calendar ha sido desconectado exitosamente",
        });
        setStatus({ connected: false, config: null });
        setCalendars([]);
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo desconectar Google Calendar",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Sincronización completada",
          description: `Importados: ${data.result.imported}, Actualizados: ${data.result.updated}, Errores: ${data.result.errors}`,
        });
        await fetchStatus();
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo sincronizar con Google Calendar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchCalendars = async () => {
    setFetchingCalendars(true);
    try {
      const response = await fetch("/api/calendar/calendars", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCalendars(data.calendars);
        toast({
          title: "Calendarios actualizados",
          description: `Se encontraron ${data.calendars.length} calendarios`,
        });
      } else {
        throw new Error(data.error || "Failed to fetch calendars");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo obtener los calendarios de Google",
        variant: "destructive",
      });
    } finally {
      setFetchingCalendars(false);
    }
  };

  const handleCalendarToggle = async (calendarId: string, selected: boolean) => {
    try {
      const response = await fetch(`/api/calendar/calendars/${calendarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected }),
      });

      if (response.ok) {
        setCalendars(calendars.map(cal => 
          cal.id === calendarId ? { ...cal, selected } : cal
        ));
      } else {
        throw new Error("Failed to update calendar");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la selección del calendario",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Sincroniza tus eventos con Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!status?.connected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Conecta tu cuenta de Google para sincronizar eventos entre BrainPortal y Google Calendar.
              </p>
              <Button onClick={handleConnect} className="w-full sm:w-auto">
                <Link className="h-4 w-4 mr-2" />
                Conectar con Google
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Conectado</span>
                  </div>
                  {status.config?.last_sync && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronización: {new Date(status.config.last_sync).toLocaleString("es-DO")}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </div>

              {/* Sync Statistics */}
              {status.config?.sync_stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{status.config.sync_stats.synced_events}</p>
                    <p className="text-xs text-muted-foreground">Sincronizados</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{status.config.sync_stats.pending_events}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{status.config.sync_stats.error_events}</p>
                    <p className="text-xs text-muted-foreground">Errores</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{status.config.sync_stats.conflict_events}</p>
                    <p className="text-xs text-muted-foreground">Conflictos</p>
                  </div>
                </div>
              )}

              {/* Sync Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar ahora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchCalendars}
                  disabled={fetchingCalendars}
                >
                  {fetchingCalendars ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Actualizar calendarios
                </Button>
              </div>

              {/* Calendar Selection */}
              {calendars.length > 0 && (
                <div className="space-y-3">
                  <Label>Calendarios para sincronizar</Label>
                  <div className="space-y-2">
                    {calendars.map((calendar) => (
                      <div key={calendar.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={calendar.id}
                          checked={calendar.selected}
                          onCheckedChange={(checked) => 
                            handleCalendarToggle(calendar.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={calendar.id}
                          className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {calendar.summary}
                          {calendar.primary && (
                            <Badge variant="secondary" className="ml-2">
                              Principal
                            </Badge>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La sincronización con Google Calendar permite importar y exportar eventos.
          Los cambios realizados en Google Calendar se reflejarán en BrainPortal y viceversa.
        </AlertDescription>
      </Alert>
    </div>
  );
}