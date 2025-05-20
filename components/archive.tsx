"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Tipo para notas archivadas
type Note = {
  id: string;
  title: string;
  content: string | null;
  project_id: string | null;
  date: string;
};

export function Archive() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from<Note>("notes")
        .select("id,title,content,project_id,date")
        .order("date", { ascending: false });
      if (error) console.error("Error loading archived notes:", error);
      else setNotes(data ?? []);
    };
    loadNotes();
  }, []);

  return (
    <div className="space-y-6" data-oid="m987rp7">
      <h1 className="text-2xl font-bold" data-oid="7h0u42:">
        Archivo
      </h1>
      <p className="text-muted-foreground" data-oid="yf2cnq_">
        Aquí encontrarás tus notas archivadas.
      </p>
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-oid="llmbhz-">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-border rounded-md p-4 bg-card hover:bg-card/80 transition-colors h-40 overflow-hidden"
              data-oid="note-card"
            >
              <h3 className="font-medium mb-2 truncate" data-oid="note-title">
                {note.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2" data-oid="note-date">
                {note.date}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-4" data-oid="note-content">
                {note.content}
              </p>
            </div>
          ))}
        </div>
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
