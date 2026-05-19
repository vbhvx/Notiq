"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../providers";

interface Tag {
  id: string;
  name: string;
  count?: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  actionItems: string[];
  isArchived: boolean;
  isPublic: boolean;
  shareId: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);
      params.set("sort", sort);

      const res = await fetch(`/api/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {
      addToast("Failed to fetch notes", "error");
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, sort, addToast]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);

  useEffect(() => {
    const timer = setTimeout(() => fetchNotes(), 300);
    return () => clearTimeout(timer);
  }, [search, fetchNotes]);

  const createNote = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "" }),
      });
      if (res.ok) {
        const note = await res.json();
        router.push(`/notes/${note.id}`);
      }
    } catch {
      addToast("Failed to create note", "error");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPreview = (content: string) => {
    if (!content) return "Empty note";
    return content.replace(/[#*_~`>\-\[\]]/g, "").slice(0, 150);
  };

  return (
    <>
      <div className="notes-header">
        <h2>📝 My Notes</h2>
        <div className="search-bar">
          <input
            id="search-input"
            className="input"
            placeholder="Search notes... (Ctrl+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            style={{ width: "auto", minWidth: 130 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Recently Created</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={createNote} disabled={creating}>
          {creating ? "Creating..." : "＋ New Note"}
          <kbd className="kbd" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>Ctrl+N</kbd>
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="filter-bar">
          <button
            className={`filter-chip ${!activeTag ? "active" : ""}`}
            onClick={() => setActiveTag("")}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              className={`filter-chip ${activeTag === tag.name ? "active" : ""}`}
              onClick={() => setActiveTag(activeTag === tag.name ? "" : tag.name)}
            >
              {tag.name} <span style={{ opacity: 0.5 }}>({tag.count})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="ai-loading">
            <div className="spinner" />
            <span>Loading notes...</span>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>{search || activeTag ? "No notes found" : "No notes yet"}</h3>
          <p>{search || activeTag ? "Try different search terms or filters" : "Create your first note to get started"}</p>
          {!search && !activeTag && (
            <button className="btn btn-primary" onClick={createNote}>
              ＋ Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className="note-card animate-in"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => router.push(`/notes/${note.id}`)}
            >
              <div className="note-card-title">
                {note.title || "Untitled"}
              </div>
              <div className="note-card-preview">
                {getPreview(note.content)}
              </div>
              {note.tags.length > 0 && (
                <div className="note-card-tags">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="tag">{tag.name}</span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="tag" style={{ opacity: 0.6 }}>+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
              <div className="note-card-footer">
                <span className="note-card-date">{formatDate(note.updatedAt)}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {note.isPublic && <span className="badge badge-info">Public</span>}
                  {note.summary && <span className="badge badge-success">AI</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
