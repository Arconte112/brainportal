"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useData } from "@/hooks/data-provider";
import { logger } from "@/lib/logger";
import { toast } from "@/components/ui/use-toast";

type Note = {
  id: string;
  title: string;
  content: string;
  projectId: string | null;
  date: string;
};

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
}

interface NoteDialogProps {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: {
    id: string;
    title: string;
    content: string;
    date: string;
    projectId: string | null;
    taskId: string | null;
  }) => void;
  onSaveNew: (updated: {
    title: string;
    content: string;
    date: string;
    projectId: string | null;
    taskId: string | null;
  }) => void;
  isNew: boolean;
}

export function NoteDialog({
  note,
  open,
  onOpenChange,
  onUpdate,
  onSaveNew,
  isNew,
}: NoteDialogProps) {
  const { projects, tasks } = useData();
  const [editedNote, setEditedNote] = useState<Note>(note);
  const [isEditing, setIsEditing] = useState(isNew);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Update local state when the note prop changes
  useEffect(() => {
    setEditedNote(note);
    setIsEditing(isNew);
  }, [note, isNew]);

  // Ya no necesitamos fetch de projects y tasks porque vienen del DataProvider

  // Fetch existing task link for existing notes
  useEffect(() => {
    if (!open || isNew) return;
    const fetchLink = async () => {
      // Use maybeSingle to avoid error when no link exists
      const { data, error } = await supabase
        .from("task_note_links")
        .select("task_id")
        .eq("note_id", note.id)
        .maybeSingle();
      if (error) {
        console.error("Error loading task link:", error);
      } else {
        setSelectedTaskId(data?.task_id || null);
      }
    };
    fetchLink();
  }, [open, note.id, isNew]);

  const handleSave = () => {
    const payload = {
      id: editedNote.id,
      title: editedNote.title,
      content: editedNote.content,
      date: editedNote.date,
      projectId: editedNote.projectId,
      taskId: selectedTaskId,
    };
    if (isNew) {
      onSaveNew({
        title: payload.title,
        content: payload.content,
        date: payload.date,
        projectId: payload.projectId,
        taskId: payload.taskId,
      });
    } else {
      onUpdate(payload);
    }
    setIsEditing(false);
  };

  const handleChange = (field: keyof Note, value: string) => {
    setEditedNote((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="obyue6h">
      <DialogContent className="sm:max-w-[550px] bg-card" data-oid="2kuphhh">
        <DialogHeader data-oid="bfq7uvw">
          <DialogTitle data-oid="3ehq-e9">
            {isEditing ? "Editar Nota" : "Detalles de la Nota"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4" data-oid="rwkoxn6">
          {isEditing ? (
            <>
              <div className="space-y-2" data-oid="g71cd:r">
                <Label htmlFor="title" data-oid="r13_60v">
                  Título
                </Label>
                <Input
                  id="title"
                  value={editedNote.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Título de la nota"
                  data-oid="84qbi5d"
                />
              </div>
              <div className="space-y-2" data-oid=".s3jl:i">
                <Label htmlFor="date" data-oid=":e2gu3g">
                  Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={editedNote.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  data-oid="_c037s1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Proyecto</Label>
                <Select
                  value={editedNote.projectId ?? "none"}
                  onValueChange={(v) =>
                    setEditedNote((prev) => ({
                      ...prev,
                      projectId: v === "none" ? null : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task">Tarea</Label>
                <Select
                  value={selectedTaskId ?? "none"}
                  onValueChange={(v) =>
                    setSelectedTaskId(v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin tarea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tarea</SelectItem>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2" data-oid="_b25ocr">
                <Label htmlFor="content" data-oid="dy868l9">
                  Contenido
                </Label>
                <Textarea
                  id="content"
                  value={editedNote.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="Contenido de la nota"
                  rows={8}
                  data-oid="1m7lzvi"
                />
              </div>
            </>
          ) : (
            <>
              <div
                className="flex justify-between items-center"
                data-oid="e0s05fs"
              >
                <h3 className="text-lg font-medium" data-oid="vpnxb.h">
                  {editedNote.title}
                </h3>
                <span
                  className="text-sm text-muted-foreground"
                  data-oid="kdmr-t:"
                >
                  {editedNote.date}
                </span>
              </div>
              <div
                className="bg-background/50 p-4 rounded-md min-h-[200px] whitespace-pre-wrap"
                data-oid="84ndaru"
              >
                {editedNote.content || (
                  <span
                    className="text-muted-foreground italic"
                    data-oid="0apq4h7"
                  >
                    Sin contenido
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter
          className="flex justify-between sm:justify-between"
          data-oid="s7v1xq0"
        >
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-oid="l2v59_f"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} data-oid="qblxqlg">
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-oid="rfhvlu0"
              >
                Cerrar
              </Button>
              <Button onClick={() => setIsEditing(true)} data-oid="3e24p2.">
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
