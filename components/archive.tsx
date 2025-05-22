"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { NoteDialog } from "@/components/note-dialog";
import type { Note, DatabaseNote } from "@/types";

export function Archive() {
  const [notes, setNotes] = useState<DatabaseNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<DatabaseNote | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id,title,content,project_id,date,projects(name,color)")
        .order("date", { ascending: false });
      if (error) console.error("Error loading archived notes:", error);
      else setNotes(data ?? []);
    };
    loadNotes();
  }, []);

  return (
    <div className="space-y-6" data-oid="m987rp7">
      <h1 className="text-2xl font-bold" data-oid="7h0u42:">
        Notas
      </h1>
      <p className="text-muted-foreground" data-oid="yf2cnq_">
        Aquí aparecerán todas las notas creadas.
      </p>
      {notes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-oid="llmbhz-">
            {notes.map((note) => (
              <div
                key={note.id}
                className="cursor-pointer border border-border rounded-md p-4 bg-card hover:bg-card/80 transition-colors h-40 overflow-hidden"
                data-oid="note-card"
                onClick={() => {
                  setSelectedNote(note);
                  setOpenDialog(true);
                }}
              >
              <h3 className="font-medium mb-2 truncate" data-oid="note-title">
                {note.title}
              </h3>
              {note.projects && (
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium text-white rounded mb-2"
                  style={{ backgroundColor: note.projects.color }}
                >
                  {note.projects.name}
                </span>
              )}
              <p className="text-xs text-muted-foreground mb-2" data-oid="note-date">
                {note.date}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-4" data-oid="note-content">
                {note.content}
              </p>
            </div>
          ))}
          </div>
          {selectedNote && (
            <NoteDialog
              note={{
                id: selectedNote.id,
                title: selectedNote.title,
                content: selectedNote.content ?? "",
                projectId: selectedNote.project_id,
                date: selectedNote.date,
              }}
              open={openDialog}
              onOpenChange={(open) => {
                setOpenDialog(open);
                if (!open) setSelectedNote(null);
              }}
              onUpdate={async (updated) => {
                const { data: updatedData, error } = await supabase
                  .from("notes")
                  .update({
                    title: updated.title,
                    content: updated.content,
                    date: updated.date,
                    project_id: updated.projectId,
                  })
                  .eq("id", updated.id)
                  .select("id,title,content,project_id,date,projects(name,color)");
                if (error) {
                  console.error("Error updating note:", error);
                } else if (updatedData) {
                  // Update task associations
                  const { error: delError } = await supabase
                    .from("task_note_links")
                    .delete()
                    .eq("note_id", updated.id);
                  if (delError)
                    console.error("Error deleting task links:", delError);
                  if (updated.taskId) {
                    const { error: insError } = await supabase
                      .from("task_note_links")
                      .insert({ note_id: updated.id, task_id: updated.taskId });
                    if (insError)
                      console.error("Error inserting task link:", insError);
                  }
                  setNotes((prev) =>
                    prev.map((n) =>
                      n.id === updated.id ? {
                        ...n,
                        title: updatedData[0].title,
                        content: updatedData[0].content,
                        date: updatedData[0].date,
                        projectId: updatedData[0].project_id
                      } : n
                    )
                  );
                }
              }}
              onSaveNew={async () => {}}
              isNew={false}
            />
          )}
        </>
      ) : (
        <div className="border border-border rounded-md p-4 bg-card/50 flex items-center justify-center h-40" data-oid="phwohvu">
          <p className="text-muted-foreground text-sm" data-oid="5qz14h0">
            No hay notas archivadas
          </p>
        </div>
      )}
    </div>
  );
}
