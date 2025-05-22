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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, LinkIcon, X, Plus, Edit, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, Note } from "@/types";

// Usar tipos centrales en lugar de definiciones locales

interface TaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (task: Task) => void;
  onSaveNew: (task: Task) => void;
  isNew: boolean;
  projectNotes: Note[]; // Notas disponibles para enlazar
  onUpdateNote?: (note: Note) => void; // Nueva prop para actualizar notas
  projects?: { id: string; name: string; color?: string }[]; // Lista de proyectos para enlace
}

export function TaskDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
  onSaveNew,
  isNew,
  projectNotes,
  onUpdateNote,
  projects = [],
}: TaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [isEditing, setIsEditing] = useState(isNew);
  const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("none");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState<Note | null>(null);

  // Update local state when the task prop changes
  useEffect(() => {
    setEditedTask(task);
    setIsEditing(isNew);

    // Buscar las notas enlazadas si existen
    if (
      task.linkedNoteIds &&
      task.linkedNoteIds.length > 0 &&
      projectNotes.length > 0
    ) {
      const notes = task.linkedNoteIds
        .map((id) => projectNotes.find((note) => note.id === id))
        .filter((note): note is Note => note !== undefined);
      setLinkedNotes(notes);
    } else {
      setLinkedNotes([]);
    }
  }, [task, isNew, projectNotes]);

  const handleSave = () => {
    // Asegurarse de que linkedNoteIds esté actualizado antes de guardar
    const updatedTask = {
      ...editedTask,
      linkedNoteIds: linkedNotes.map((note) => note.id),
    };

    if (isNew) {
      onSaveNew(updatedTask);
    } else {
      onUpdate(updatedTask);
    }
    setIsEditing(false);
  };

  const handleChange = (field: keyof Task, value: string) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };
  // Maneja cambio de proyecto relacionado; 'none' limpia selección
  const handleProjectChange = (value: string) => {
    setEditedTask((prev) =>
      value === "none"
        ? { ...prev, projectId: undefined }
        : { ...prev, projectId: value }
    );
  };

  const handleAddNote = () => {
    if (selectedNoteId === "none") return;

    const noteToAdd = projectNotes.find((note) => note.id === selectedNoteId);
    if (!noteToAdd) return;

    // Verificar si la nota ya está añadida
    if (linkedNotes.some((note) => note.id === selectedNoteId)) return;

    setLinkedNotes((prev) => [...prev, noteToAdd]);
    setSelectedNoteId("none");
  };

  const handleRemoveNote = (noteId: string) => {
    setLinkedNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setEditedNote(note);
    setIsEditingNote(false);
    setNoteDialogOpen(true);
  };

  const handleEditNote = () => {
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (!editedNote || !onUpdateNote) return;

    onUpdateNote(editedNote);
    setSelectedNote(editedNote);
    setIsEditingNote(false);
  };

  const handleNoteChange = (field: keyof Note, value: string) => {
    if (!editedNote) return;
    setEditedNote((prev) => ({ ...prev!, [field]: value }));
  };

  // Resetear filtro de notas al cambiar de proyecto
  // Filtrar notas según proyecto seleccionado
  const filteredProjectNotes = editedTask.projectId
    ? projectNotes.filter(
        (note) =>
          note.projectId === editedTask.projectId || !note.projectId,
      )
    : projectNotes;
  // Filtrar notas que aún no han sido añadidas
  const availableNotes = filteredProjectNotes.filter(
    (note) => !linkedNotes.some((linkedNote) => linkedNote.id === note.id),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] bg-card">
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? isNew
                  ? "Nueva Tarea"
                  : "Editar Tarea"
                : "Detalles de la Tarea"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={editedTask.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Título de la tarea"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) => handleChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editedTask.dueDate || ""}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={editedTask.description || ""}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Descripción de la tarea"
                    rows={4}
                  />
                </div>
                {projects.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="project">Proyecto relacionado</Label>
                    <Select
                      value={editedTask.projectId ?? "none"}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proyecto</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {projectNotes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Notas relacionadas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {linkedNotes.map((note) => (
                        <Badge
                          key={note.id}
                          variant="secondary"
                          className="flex items-center gap-1 py-1 px-2"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{note.title}</span>
                          <button
                            onClick={() => handleRemoveNote(note.id)}
                            className="ml-1 hover:text-destructive"
                            title="Eliminar"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedNoteId}
                        onValueChange={setSelectedNoteId}
                        disabled={availableNotes.length === 0}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar nota" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Seleccionar nota...
                          </SelectItem>
                        {availableNotes.map((note) => (
                            <SelectItem key={note.id} value={note.id}>
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />

                                {note.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddNote}
                        disabled={
                          selectedNoteId === "none" ||
                          availableNotes.length === 0
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {availableNotes.length === 0 && linkedNotes.length < projectNotes.length && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Todas las notas disponibles ya han sido añadidas.
                      </p>
                    )}
                  </div>
                )}
                {!isNew && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={editedTask.status}
                      onValueChange={(value: "pending" | "done") =>
                        handleChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="done">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{editedTask.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground capitalize">
                      Prioridad:{" "}
                      {editedTask.priority === "high"
                        ? "Alta"
                        : editedTask.priority === "medium"
                          ? "Media"
                          : "Baja"}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        editedTask.priority === "high"
                          ? "bg-destructive"
                          : editedTask.priority === "medium"
                            ? "bg-white"
                            : "bg-muted-foreground"
                      }`}
                    />
                  </div>
                </div>

                {editedTask.dueDate && (
                  <div className="text-sm text-muted-foreground">
                    Fecha de vencimiento:{" "}
                    {new Date(editedTask.dueDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}

                <div className="bg-background/50 p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {editedTask.description || (
                    <span className="text-muted-foreground italic">
                      Sin descripción
                    </span>
                  )}
                </div>

                {linkedNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Notas relacionadas ({linkedNotes.length})
                    </h4>
                    <ScrollArea className="max-h-[150px]">
                      <div className="space-y-2">
                        {linkedNotes.map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center gap-2 p-3 bg-secondary/20 rounded-md hover:bg-secondary/30 cursor-pointer transition-colors"
                            onClick={() => handleNoteClick(note)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />

                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {note.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {note.date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Estado:{" "}
                  <span className="font-medium">
                    {editedTask.status === "pending"
                      ? "Pendiente"
                      : "Completada"}
                  </span>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Guardar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para mostrar y editar la nota seleccionada */}
      {selectedNote && (
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="sm:max-w-[550px] bg-card">
            <DialogHeader>
              <DialogTitle>
                {isEditingNote ? "Editar Nota" : "Nota"}:{" "}
                {isEditingNote ? "" : selectedNote.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isEditingNote && editedNote ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Título</Label>
                    <Input
                      id="note-title"
                      value={editedNote.title}
                      onChange={(e) =>
                        handleNoteChange("title", e.target.value)
                      }
                      placeholder="Título de la nota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-date">Fecha</Label>
                    <Input
                      id="note-date"
                      type="date"
                      value={editedNote.date}
                      onChange={(e) => handleNoteChange("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Contenido</Label>
                    <Textarea
                      id="note-content"
                      value={editedNote.content}
                      onChange={(e) =>
                        handleNoteChange("content", e.target.value)
                      }
                      placeholder="Contenido de la nota"
                      rows={8}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {selectedNote.date}
                    </span>
                  </div>
                  <div className="bg-background/50 p-4 rounded-md min-h-[200px] whitespace-pre-wrap">
                    {selectedNote.content || (
                      <span className="text-muted-foreground italic">
                        Sin contenido
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              {isEditingNote ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingNote(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNote} disabled={!onUpdateNote}>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setNoteDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                  {onUpdateNote && (
                    <Button onClick={handleEditNote}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
