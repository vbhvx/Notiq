"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../providers";
import { DocumentTextIcon, PlusIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchNotes = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        setPagination(data.pagination);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes(1);
    fetchTags();
  }, [fetchNotes, fetchTags]);

  useEffect(() => {
    const timer = setTimeout(() => fetchNotes(1), 300);
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

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setLoading(true);
    fetchNotes(page);
  };

  return (
    <>
      <div className="notes-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><DocumentTextIcon className="w-6 h-6" /> My Notes</h2>
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
            style={{ width: "auto", minWidth: 165, color: "var(--text-secondary)", fontWeight: 400 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Recently Created</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={createNote} disabled={creating} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {creating ? "Creating..." : <><PlusIcon className="w-5 h-5" /> New Note</>}
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
          <div className="empty-state-icon"><DocumentTextIcon className="w-12 h-12" style={{ margin: "0 auto" }} /></div>
          <h3>{search || activeTag ? "No notes found" : "No notes yet"}</h3>
          <p>{search || activeTag ? "Try different search terms or filters" : "Create your first note to get started"}</p>
          {!search && !activeTag && (
            <button className="btn btn-primary" onClick={createNote} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PlusIcon className="w-5 h-5" /> Create your first note
            </button>
          )}
        </div>
      ) : (
        <>
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


          {pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "20px 32px 32px",
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <ArrowLeftIcon className="w-4 h-4" /> Previous
              </button>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Page {pagination.page} of {pagination.totalPages}
                <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>
                  ({pagination.total} notes)
                </span>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                Next <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
