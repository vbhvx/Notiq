"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../providers";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: { id: string; name: string }[];
  updatedAt: string;
}

export default function ArchivedPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = useCallback(async () => {
    try {
      const res = await fetch("/api/notes?archived=true");
      if (res.ok) setNotes(await res.json());
    } catch { addToast("Failed to load archived notes", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);

  const unarchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      addToast("Note restored", "success");
    } catch { addToast("Failed to restore", "error"); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="notes-header">
        <h2>📦 Archived Notes</h2>
      </div>
      {loading ? (
        <div className="empty-state"><div className="ai-loading"><div className="spinner" /><span>Loading...</span></div></div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No archived notes</h3>
          <p>Archived notes will appear here</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card" onClick={() => router.push(`/notes/${note.id}`)}>
              <div className="note-card-title">{note.title || "Untitled"}</div>
              <div className="note-card-preview">{note.content?.slice(0, 120) || "Empty note"}</div>
              <div className="note-card-footer">
                <span className="note-card-date">{formatDate(note.updatedAt)}</span>
                <button className="btn btn-ghost btn-sm" onClick={(e) => unarchive(note.id, e)}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
