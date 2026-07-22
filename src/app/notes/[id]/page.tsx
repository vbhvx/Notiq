"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "../../providers";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitize";
import { 
  ArrowLeftIcon, BookOpenIcon, CpuChipIcon, LinkIcon, ArchiveBoxIcon, TrashIcon, 
  XMarkIcon, SparklesIcon, CheckBadgeIcon, LightBulbIcon, RocketLaunchIcon, DocumentTextIcon, CheckIcon 
} from "@heroicons/react/24/outline";

interface Tag { id: string; name: string; }
interface Note {
  id: string; title: string; content: string;
  summary: string | null; actionItems: string[];
  isArchived: boolean; isPublic: boolean; shareId: string;
  tags: Tag[]; createdAt: string; updatedAt: string;
}

export default function NoteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState<"saved" | "saving" | "unsaved">("saved");
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showAi, setShowAi] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchNote = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) { router.push("/dashboard"); return; }
      const data: Note = await res.json();
      setNote(data);
      setTitle(data.title);
      setContent(data.content);
      setTags(data.tags.map((t) => t.name));
    } catch { router.push("/dashboard"); }
    finally { setLoading(false); }
  }, [noteId, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchNote(); }, [fetchNote]);

  const saveNote = useCallback(async (t: string, c: string, tagsList: string[]) => {
    setSaving("saving");
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, content: c, tags: tagsList }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNote(updated);
        setSaving("saved");
      }
    } catch { setSaving("unsaved"); }
  }, [noteId]);
  const debouncedSave = useCallback((t: string, c: string, tagsList: string[]) => {
    setSaving("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(t, c, tagsList), 1500);
  }, [saveNote]);

  const handleTitleChange = (v: string) => { setTitle(v); debouncedSave(v, content, tags); };
  const handleContentChange = (v: string) => { setContent(v); debouncedSave(title, v, tags); };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      const newTags = [...tags, t];
      setTags(newTags);
      setTagInput("");
      debouncedSave(title, content, newTags);
    }
  };

  const removeTag = (name: string) => {
    const newTags = tags.filter((t) => t !== name);
    setTags(newTags);
    debouncedSave(title, content, newTags);
  };

  const handleAi = async (type: string) => {
    setAiLoading(type);
    try {
      await saveNote(title, content, tags);
      const res = await fetch(`/api/notes/${noteId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.summary !== undefined && note) setNote({ ...note, summary: data.summary });
      if (data.actionItems !== undefined && note) setNote({ ...note, actionItems: data.actionItems });
      if (data.suggestedTitle) {
        setTitle(data.suggestedTitle);
        debouncedSave(data.suggestedTitle, content, tags);
      }
      addToast(`AI ${type.replace("_", " ")} generated!`, "success");
      fetchNote();
    } catch { addToast("AI generation failed. Check your API key.", "error"); }
    finally { setAiLoading(null); }
  };

  const togglePublic = async () => {
    if (!note) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !note.isPublic }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNote(updated);
        addToast(updated.isPublic ? "Note is now public" : "Note is now private", "success");
      }
    } catch { addToast("Failed to update visibility", "error"); }
  };

  const archiveNote = async () => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      addToast("Note archived", "success");
      router.push("/dashboard");
    } catch { addToast("Failed to archive", "error"); }
  };

  const deleteNote = async () => {
    if (!confirm("Delete this note permanently?")) return;
    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      addToast("Note deleted", "success");
      router.push("/dashboard");
    } catch { addToast("Failed to delete", "error"); }
  };

  const copyShareLink = () => {
    if (!note) return;
    navigator.clipboard.writeText(`${window.location.origin}/shared/${note.shareId}`);
    addToast("Share link copied!", "success");
    setShowShare(false);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveNote(title, content, tags);
        addToast("Saved!", "success");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowPreview((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [title, content, tags, saveNote, addToast]);

  if (loading) return <div className="empty-state" style={{ height: "100vh" }}><div className="ai-loading"><div className="spinner" /><span>Loading note...</span></div></div>;

  const renderedMarkdown = (() => {
    try { return sanitizeHtml(marked(content || "*Start writing...*") as string); }
    catch { return content; }
  })();

  return (
    <div className="editor-container">
      <div className="editor-main">
        <div className="editor-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
          <div className="save-indicator">
            <div className={`save-dot ${saving}`} />
            {saving === "saved" ? "Saved" : saving === "saving" ? "Saving..." : "Unsaved"}
          </div>
          <div style={{ flex: 1 }} />
          <button className={`btn btn-ghost btn-sm ${showPreview ? "" : ""}`} onClick={() => setShowPreview(!showPreview)} title="Toggle preview (Ctrl+P)" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpenIcon className="w-4 h-4" /> {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAi(!showAi)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CpuChipIcon className="w-4 h-4" /> {showAi ? "Hide AI" : "AI Panel"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowShare(true)} title="Share"><LinkIcon className="w-4 h-4" /> Share</button>
          <button className="btn btn-ghost btn-sm" onClick={archiveNote} title="Archive"><ArchiveBoxIcon className="w-4 h-4" /></button>
          <button className="btn btn-ghost btn-sm" onClick={deleteNote} title="Delete" style={{ color: "var(--danger)" }}><TrashIcon className="w-4 h-4" /></button>
        </div>

        <input
          className="editor-title-input"
          placeholder="Untitled Note"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <div style={{ padding: "8px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>Tags:</span>
          {tags.map((tag) => (
            <span key={tag} className="tag tag-removable" onClick={() => removeTag(tag)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {tag} <XMarkIcon className="w-3 h-3" />
            </span>
          ))}
          <input
            style={{ border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", fontSize: "0.8rem", width: 100, fontFamily: "var(--font)" }}
            placeholder="Add tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          />
        </div>

        <div className="editor-body">
          <textarea
            className="editor-textarea"
            placeholder="Start writing your note... (Markdown supported)"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
          />
          {showPreview && (
            <div
              className="editor-preview"
              dangerouslySetInnerHTML={{ __html: renderedMarkdown as string }}
            />
          )}
        </div>
      </div>

      {showAi && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><CpuChipIcon className="w-5 h-5" /> AI Assistant</h3>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAi(false)}><XMarkIcon className="w-5 h-5" /></button>
          </div>

          <div className="ai-section">
            <h4>Quick Actions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAi("summary")} disabled={!!aiLoading || !content.trim()} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                {aiLoading === "summary" ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : <><SparklesIcon className="w-4 h-4" /> Generate Summary</>}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAi("action_items")} disabled={!!aiLoading || !content.trim()} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                {aiLoading === "action_items" ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Extracting...</> : <><CheckBadgeIcon className="w-4 h-4" /> Extract Action Items</>}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAi("title")} disabled={!!aiLoading || !content.trim()} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                {aiLoading === "title" ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Suggesting...</> : <><LightBulbIcon className="w-4 h-4" /> Suggest Title</>}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleAi("all")} disabled={!!aiLoading || !content.trim()} style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                {aiLoading === "all" ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Processing...</> : <><RocketLaunchIcon className="w-4 h-4" /> Generate All</>}
              </button>
            </div>
          </div>

          {note?.summary && (
            <div className="ai-section">
              <h4 style={{ display: "flex", alignItems: "center", gap: 6 }}><DocumentTextIcon className="w-4 h-4" /> Summary</h4>
              <div className="ai-summary">{note.summary}</div>
            </div>
          )}

          {note?.actionItems && note.actionItems.length > 0 && (
            <div className="ai-section">
              <h4 style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckBadgeIcon className="w-4 h-4" /> Action Items</h4>
              {note.actionItems.map((item, i) => (
                <div key={i} className="ai-action-item">{item}</div>
              ))}
            </div>
          )}

          {!note?.summary && !note?.actionItems?.length && (
            <div className="ai-section" style={{ opacity: 0.5 }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", textAlign: "center", padding: "20px 0" }}>
                Write some content, then use the AI actions above to generate summaries and extract action items.
              </p>
            </div>
          )}
        </div>
      )}

      {showShare && note && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><LinkIcon className="w-5 h-5" /> Share Note</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: "0.9rem" }}>Public visibility</span>
                <button
                  className={`btn btn-sm ${note.isPublic ? "btn-primary" : "btn-secondary"}`}
                  onClick={togglePublic}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {note.isPublic ? <><CheckIcon className="w-4 h-4" /> Public</> : "Private"}
                </button>
              </div>
              {note.isPublic && (
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Share link</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${note.shareId}`}
                      style={{ fontSize: "0.8rem" }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={copyShareLink}>Copy</button>
                  </div>
                </div>
              )}
              {!note.isPublic && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                  Enable public visibility to generate a share link.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowShare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
