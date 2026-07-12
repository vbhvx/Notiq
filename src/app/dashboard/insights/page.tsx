"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArchiveBoxIcon, 
  GlobeAltIcon, 
  SparklesIcon, 
  TagIcon, 
  ClockIcon 
} from "@heroicons/react/24/outline";

interface InsightsData {
  totalNotes: number;
  archivedNotes: number;
  publicNotes: number;
  recentlyEdited: { id: string; title: string; updatedAt: string }[];
  mostUsedTags: { name: string; count: number }[];
  aiStats: { total: number; byType: Record<string, number> };
  weeklyActivity: { date: string; day: string; created: number; updated: number }[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (res.ok) setData(await res.json());
    } catch {  }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  if (loading) return <div className="empty-state"><div className="ai-loading"><div className="spinner" /><span>Loading insights...</span></div></div>;
  if (!data) return <div className="empty-state"><h3>Failed to load insights</h3></div>;

  const maxActivity = Math.max(...data.weeklyActivity.map((d) => d.created + d.updated), 1);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="insights-page">
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><ChartBarIcon className="w-6 h-6" /> Productivity Insights</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon"><DocumentTextIcon className="w-6 h-6" style={{ margin: "0 auto" }} /></div>
          <div className="stat-card-value" style={{ color: "var(--accent)" }}>{data.totalNotes}</div>
          <div className="stat-card-label">Active Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><ArchiveBoxIcon className="w-6 h-6" style={{ margin: "0 auto" }} /></div>
          <div className="stat-card-value" style={{ color: "var(--warning)" }}>{data.archivedNotes}</div>
          <div className="stat-card-label">Archived</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><GlobeAltIcon className="w-6 h-6" style={{ margin: "0 auto" }} /></div>
          <div className="stat-card-value" style={{ color: "var(--info)" }}>{data.publicNotes}</div>
          <div className="stat-card-label">Public Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><SparklesIcon className="w-6 h-6" style={{ margin: "0 auto" }} /></div>
          <div className="stat-card-value" style={{ color: "var(--success)" }}>{data.aiStats.total}</div>
          <div className="stat-card-label">AI Generations</div>
        </div>
      </div>

      <div className="insights-section">
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><ChartBarIcon className="w-5 h-5" /> Weekly Activity</h3>
        <div className="card" style={{ padding: 24 }}>
          <div className="activity-chart">
            {data.weeklyActivity.map((day) => (
              <div key={day.date} className="activity-bar-group">
                <div
                  className="activity-bar"
                  style={{ height: `${Math.max(((day.created + day.updated) / maxActivity) * 100, 4)}%` }}
                  title={`${day.created} created, ${day.updated} updated`}
                />
                <span className="activity-label">{day.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--accent)", borderRadius: 2, marginRight: 4 }} />Activity</span>
          </div>
        </div>
      </div>

      {data.aiStats.total > 0 && (
        <div className="insights-section">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><SparklesIcon className="w-5 h-5" /> AI Usage Breakdown</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <div className="stat-card">
              <div className="stat-card-value" style={{ fontSize: "1.5rem", color: "var(--accent)" }}>
                {data.aiStats.byType["summary"] || 0}
              </div>
              <div className="stat-card-label">Summaries</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ fontSize: "1.5rem", color: "var(--success)" }}>
                {data.aiStats.byType["action_items"] || 0}
              </div>
              <div className="stat-card-label">Action Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ fontSize: "1.5rem", color: "var(--warning)" }}>
                {data.aiStats.byType["title"] || 0}
              </div>
              <div className="stat-card-label">Title Suggestions</div>
            </div>
          </div>
        </div>
      )}

      {data.mostUsedTags.length > 0 && (
        <div className="insights-section">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><TagIcon className="w-5 h-5" /> Most Used Tags</h3>
          <div className="tag-cloud">
            {data.mostUsedTags.map((tag) => (
              <div key={tag.name} className="tag-cloud-item">
                {tag.name} <span className="tag-count">{tag.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentlyEdited.length > 0 && (
        <div className="insights-section">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><ClockIcon className="w-5 h-5" /> Recently Edited</h3>
          <div className="card" style={{ padding: 0 }}>
            {data.recentlyEdited.map((note, i) => (
              <div
                key={note.id}
                style={{
                  padding: "12px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderBottom: i < data.recentlyEdited.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
                onClick={() => window.location.href = `/notes/${note.id}`}
              >
                <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{note.title || "Untitled"}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>{formatDate(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
