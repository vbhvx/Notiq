"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { marked } from "marked";

interface SharedNote {
  id: string; title: string; content: string;
  summary: string | null; actionItems: string[];
  tags: { id: string; name: string }[];
  author: string; createdAt: string; updatedAt: string;
}

export default function SharedNotePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shared/${shareId}`);
        if (!res.ok) { setError(true); return; }
        setNote(await res.json());
      } catch { setError(true); }
      finally { setLoading(false); }
    })();
  }, [shareId]);

  if (loading) return (
    <div className="shared-page">
      <div style={{ textAlign: "center" }}>
        <div className="ai-loading"><div className="spinner" /><span>Loading shared note...</span></div>
      </div>
    </div>
  );

  if (error || !note) return (
    <div className="shared-page">
      <div className="shared-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: "1.5rem" }}>Note Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>This note doesn&apos;t exist or is no longer public.</p>
      </div>
    </div>
  );

  const rendered = (() => { try { return marked(note.content || ""); } catch { return note.content; } })();
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="shared-page">
      <div className="shared-card animate-in">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 50, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }}>
            ✦ Shared via Notiq
          </span>
        </div>

        <h1>{note.title || "Untitled"}</h1>

        <div className="shared-meta">
          <span>By {note.author}</span>
          <span>•</span>
          <span>{formatDate(note.updatedAt)}</span>
        </div>

        {note.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {note.tags.map((tag) => (
              <span key={tag.id} className="tag">{tag.name}</span>
            ))}
          </div>
        )}

        {note.summary && (
          <div style={{ padding: 16, background: "var(--accent-soft)", borderRadius: "var(--radius-md)", marginBottom: 24 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AI Summary
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{note.summary}</div>
          </div>
        )}

        <div className="shared-content editor-preview" dangerouslySetInnerHTML={{ __html: rendered as string }} />

        {note.actionItems && note.actionItems.length > 0 && (
          <div style={{ marginTop: 24, padding: 16, background: "var(--success-soft)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--success)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Action Items
            </div>
            {note.actionItems.map((item, i) => (
              <div key={i} className="ai-action-item">{item}</div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)", textAlign: "center", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
          Shared with <span style={{ fontWeight: 700, background: "linear-gradient(135deg, var(--accent), #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ Notiq</span> — AI-Powered Notes Workspace
        </div>
      </div>
    </div>
  );
}
