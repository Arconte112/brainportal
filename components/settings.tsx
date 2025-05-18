"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Settings() {
  return (
    <div className="space-y-6 max-w-2xl" data-oid="xxf8mfe">
      <h1 className="text-2xl font-bold" data-oid="lt5vsds">
        Ajustes
      </h1>

      <div className="space-y-4" data-oid="xs_2.h1">
        <h2 className="text-lg font-medium" data-oid="hsmpnzj">
          Apariencia
        </h2>
        <div
          className="space-y-4 border border-border rounded-md p-4"
          data-oid="etd_al0"
        >
          <div className="flex items-center justify-between" data-oid="7t0gshh">
            <div className="space-y-0.5" data-oid="7om4ctd">
              <Label htmlFor="dark-mode" data-oid="-75ochr">
                Modo oscuro
              </Label>
              <p className="text-sm text-muted-foreground" data-oid="duu4zcq">
                Siempre usar el tema oscuro
              </p>
            </div>
            <Switch id="dark-mode" defaultChecked data-oid="yapxy6v" />
          </div>

          <div className="flex items-center justify-between" data-oid="061dc5z">
            <div className="space-y-0.5" data-oid="dg6nw8t">
              <Label htmlFor="reduced-motion" data-oid="gexqjms">
                Reducir movimiento
              </Label>
              <p className="text-sm text-muted-foreground" data-oid="y_0q47e">
                Minimizar animaciones
              </p>
            </div>
            <Switch id="reduced-motion" data-oid="l7p1wqi" />
          </div>
        </div>
      </div>

      <div className="space-y-4" data-oid="-h:y9._">
        <h2 className="text-lg font-medium" data-oid="n9o.y_z">
          Notificaciones
        </h2>
        <div
          className="space-y-4 border border-border rounded-md p-4"
          data-oid="ayyof.c"
        >
          <div className="flex items-center justify-between" data-oid="cujymz8">
            <div className="space-y-0.5" data-oid="jkvm23:">
              <Label htmlFor="task-reminders" data-oid="4t:ttrx">
                Recordatorios de tareas
              </Label>
              <p className="text-sm text-muted-foreground" data-oid=":heq3-a">
                Recibir notificaciones para tareas pendientes
              </p>
            </div>
            <Switch id="task-reminders" defaultChecked data-oid="5fiaemr" />
          </div>

          <div className="flex items-center justify-between" data-oid="ink1w1.">
            <div className="space-y-0.5" data-oid="6rwex3m">
              <Label htmlFor="event-alerts" data-oid="g-_azhk">
                Alertas de eventos
              </Label>
              <p className="text-sm text-muted-foreground" data-oid="07mzexf">
                Recibir notificaciones para eventos próximos
              </p>
            </div>
            <Switch id="event-alerts" defaultChecked data-oid="hkwnwl8" />
          </div>
        </div>
      </div>

      <div className="space-y-4" data-oid="hy-1fc:">
        <h2 className="text-lg font-medium" data-oid="5wdqfia">
          Preferencias
        </h2>
        <div
          className="space-y-4 border border-border rounded-md p-4"
          data-oid="-cl9o2q"
        >
          <div className="space-y-2" data-oid=".xadkx0">
            <Label htmlFor="default-view" data-oid="6blqn1v">
              Vista predeterminada
            </Label>
            <Select defaultValue="today" data-oid="pe9voi9">
              <SelectTrigger id="default-view" data-oid="qlzxfu4">
                <SelectValue
                  placeholder="Seleccionar vista"
                  data-oid="obmsu58"
                />
              </SelectTrigger>
              <SelectContent data-oid="nprl-:d">
                <SelectItem value="today" data-oid="zthw2y3">
                  Hoy
                </SelectItem>
                <SelectItem value="calendar" data-oid="wbih9_a">
                  Calendario
                </SelectItem>
                <SelectItem value="projects" data-oid="wfh.6xd">
                  Proyectos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2" data-oid="f9_7n00">
            <Label htmlFor="time-format" data-oid="0pl5_ea">
              Formato de hora
            </Label>
            <Select defaultValue="24h" data-oid="80iz.yh">
              <SelectTrigger id="time-format" data-oid=".3j3m5x">
                <SelectValue
                  placeholder="Seleccionar formato"
                  data-oid="e98sl:u"
                />
              </SelectTrigger>
              <SelectContent data-oid="dj1:tr8">
                <SelectItem value="12h" data-oid="w98h38n">
                  12 horas (AM/PM)
                </SelectItem>
                <SelectItem value="24h" data-oid="l4lr6s.">
                  24 horas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end" data-oid="50pxs.a">
        <Button data-oid="5uo78dp">Guardar cambios</Button>
      </div>
    </div>
  );
}
