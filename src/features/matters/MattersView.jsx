"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { C, F } from "@/shared/constants/theme";
import { STATUS_C, TYPE_C } from "@/shared/constants/matters";
import { useMatter } from "@/shared/context/MatterContext";
import { useWorkspace } from "@/shared/convex/WorkspaceProvider";
import { NAV_ROUTES } from "@/shared/constants/routes";
import { api } from "../../../convex/_generated/api";

function fmtActivity(ts) {
  const d = new Date(ts);
  const now = new Date();
  const mins = Math.floor((now - d) / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtUpdated(ts) {
  const d = new Date(ts);
  const mins = Math.floor((Date.now() - d) / 60000);
  if (mins < 60) return "Today";
  if (mins < 2880) return "Yesterday";
  if (mins < 10_080) return `${Math.floor(mins / 1440)} days ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function MattersView() {
  const router = useRouter();
  const { clientKey } = useWorkspace();
  const { matters, setMatterId } = useMatter();
  const createMatter = useMutation(api.matters.create);

  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("Commercial");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const sel = selected ? matters.find((m) => m._id === selected) : null;
  const activities = useQuery(
    api.activities.listForMatter,
    sel ? { clientKey, matterId: sel._id, limit: 12 } : "skip",
  );

  const filtered = matters.filter((m) => {
    const matchFilter =
      filter === "ALL" ||
      m.status.toUpperCase() === filter ||
      (filter === "OPEN" && m.status !== "closed");
    const matchSearch =
      !search.trim() ||
      (m.label + m.code + m.type).toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = useMemo(
    () => ({
      total: matters.length,
      active: matters.filter((m) => m.status === "active").length,
      urgent: matters.filter((m) => m.status === "urgent").length,
      closed: matters.filter((m) => m.status === "closed").length,
    }),
    [matters],
  );

  const handleCreate = async () => {
    setCreating(true);
    setCreateError("");
    try {
      const id = await createMatter({
        clientKey,
        label: newLabel,
        type: newType,
      });
      setShowNew(false);
      setNewLabel("");
      setSelected(id);
      await setMatterId(id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create matter.");
    } finally {
      setCreating(false);
    }
  };

  const goFeature = (navId) => {
    if (sel) void setMatterId(sel._id);
    router.push(NAV_ROUTES[navId] ?? "/research");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="ast-view-header" style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", background: C.bgPanel, flexShrink: 0 }}>
        <div className="ast-view-header-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, minWidth: 0 }}>
          <span style={{ color: C.textPri }}>My Matters</span>
          <span style={{ color: C.textMut, marginLeft: 4 }}>— {matters.length} total</span>
        </div>
        <div className="ast-view-header-actions">
          <button
            type="button"
            onClick={() => setShowNew(true)}
            style={{ padding: "6px 14px", background: C.red, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: F.sans, fontWeight: 500 }}
          >
            + New Matter
          </button>
        </div>
      </div>

      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "min(420px, 100%)", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 18px" }}>
            <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 600, color: C.textPri, marginBottom: 12 }}>New matter</div>
            <label style={{ display: "block", fontSize: 9, color: C.textMut, letterSpacing: "0.08em", marginBottom: 6 }}>TITLE</label>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Acme Corp — NDA review" style={{ width: "100%", marginBottom: 12, padding: "8px 10px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textPri, fontFamily: F.sans, fontSize: 12 }} />
            <label style={{ display: "block", fontSize: 9, color: C.textMut, letterSpacing: "0.08em", marginBottom: 6 }}>TYPE</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: "100%", marginBottom: 14, padding: "8px 10px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.textPri, fontFamily: F.sans, fontSize: 12 }}>
              {["Commercial", "Criminal", "Corporate", "Tax", "Civil", "General"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {createError && <p style={{ fontSize: 11, color: C.amber, marginBottom: 10 }}>{createError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowNew(false)} style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, cursor: "pointer", fontFamily: F.sans, fontSize: 11 }}>Cancel</button>
              <button type="button" disabled={creating || newLabel.trim().length < 3} onClick={() => void handleCreate()} style={{ padding: "6px 12px", background: C.red, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontFamily: F.sans, fontSize: 11, opacity: creating ? 0.6 : 1 }}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ast-split-row" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div className="ast-split-list" style={{ width: sel ? 300 : "100%", borderRight: sel ? `1px solid ${C.border}` : "none", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.2s" }}>
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {[["ALL", stats.total, "All"], ["OPEN", stats.active + stats.urgent, "Open"], ["URGENT", stats.urgent, "Urgent"], ["CLOSED", stats.closed, "Closed"]].map(([f, n, l]) => (
              <div key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: "10px 8px", textAlign: "center", cursor: "pointer", borderBottom: `2px solid ${filter === f ? C.red : "transparent"}`, transition: "all 0.15s", background: filter === f ? C.redFaint : "transparent" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: filter === f ? C.red : C.textPri, fontFamily: F.serif }}>{n}</div>
                <div style={{ fontSize: 9, color: filter === f ? C.red : C.textMut, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 11px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search matters…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: C.textPri, fontFamily: F.sans, fontWeight: 300 }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            {filtered.length === 0 && <div style={{ textAlign: "center", color: C.textMut, fontSize: 12, fontFamily: F.sans, padding: "32px 0" }}>No matters found.</div>}
            {filtered.map((m, i) => {
              const isActive = selected === m._id;
              return (
                <div key={m._id} onClick={() => setSelected(isActive ? null : m._id)}
                  style={{ background: isActive ? C.redFaint : C.bgCard, border: `1px solid ${isActive ? C.red : C.border}`, borderRadius: 8, padding: "13px 14px", marginBottom: 7, cursor: "pointer", transition: "all 0.15s", animation: `fadeUp 0.25s ease ${i * 0.04}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, color: C.textMut, fontFamily: "monospace" }}>{m.code}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.tasks > 0 && <span style={{ fontSize: 9, color: C.amber, background: `${C.amber}18`, border: `1px solid ${C.amber}30`, borderRadius: 3, padding: "1px 6px" }}>{m.tasks} tasks</span>}
                      <span style={{ fontSize: 9, color: STATUS_C[m.status] || C.textMut, background: `${STATUS_C[m.status] || C.textMut}18`, border: `1px solid ${STATUS_C[m.status] || C.textMut}30`, borderRadius: 3, padding: "1px 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.textPri, fontFamily: F.sans, marginBottom: 3, lineHeight: 1.3 }}>{m.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: TYPE_C[m.type] || C.textSec, background: `${TYPE_C[m.type] || C.textSec}15`, border: `1px solid ${TYPE_C[m.type] || C.textSec}25`, borderRadius: 3, padding: "1px 6px" }}>{m.type}</span>
                    <span style={{ fontSize: 10, color: C.textMut, fontFamily: F.sans }}>{fmtUpdated(m.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {sel && (
          <div className="ast-split-detail" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideIn 0.2s ease" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.textMut, fontFamily: "monospace", marginBottom: 4 }}>{sel.code}</div>
                  <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: C.textPri, lineHeight: 1.25 }}>{sel.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: TYPE_C[sel.type] || C.textSec, background: `${TYPE_C[sel.type] || C.textSec}15`, border: `1px solid ${TYPE_C[sel.type] || C.textSec}25`, borderRadius: 3, padding: "2px 8px" }}>{sel.type}</span>
                    <span style={{ fontSize: 10, color: STATUS_C[sel.status] || C.textMut, background: `${STATUS_C[sel.status] || C.textMut}18`, border: `1px solid ${STATUS_C[sel.status] || C.textMut}30`, borderRadius: 3, padding: "2px 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{sel.status}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 7px", color: C.textMut, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
              <div style={{ padding: "12px 14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Matter Overview</div>
                <p style={{ fontSize: 12.5, color: C.textPri, fontFamily: F.sans, fontWeight: 300, lineHeight: 1.7 }}>{sel.desc}</p>
              </div>
              {sel.court !== "N/A" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M6 9L3 18h6L6 9z" /><path d="M18 9l-3 9h6l-3-9z" /></svg>
                  <div><div style={{ fontSize: 9, color: C.textMut, marginBottom: 2 }}>Forum</div><div style={{ fontSize: 12, color: C.textPri, fontFamily: F.sans }}>{sel.court}</div></div>
                </div>
              )}
              <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Quick Actions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  { icon: "🔍", label: "Research", desc: "Find case law", nav: "research" },
                  { icon: "📝", label: "Draft", desc: "Create document", nav: "draft" },
                  { icon: "⚑", label: "Due Diligence", desc: "Analyse contract", nav: "review" },
                  { icon: "⚖", label: "Strategy", desc: "Litigation plan", nav: "litigate" },
                ].map((a) => (
                  <button key={a.label} type="button" onClick={() => goFeature(a.nav)} style={{ padding: "12px 13px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{a.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: C.textPri, fontFamily: F.sans }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: C.textMut }}>{a.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Recent Activity</div>
              {(activities ?? []).length === 0 && (
                <div style={{ fontSize: 11, color: C.textMut, fontFamily: F.sans, padding: "8px 0" }}>Activity appears when you save work to this matter.</div>
              )}
              {(activities ?? []).map((a) => (
                <div key={a._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.textPri, fontFamily: F.sans }}>{a.action}</div>
                    <div style={{ fontSize: 10, color: C.textMut, marginTop: 1 }}>{fmtActivity(a.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
