"use client";

import { C, F } from "@/shared/constants/theme";
import Spinner from "@/shared/ui/Spinner";
import IndianKanoonAttribution from "@/features/research/IndianKanoonAttribution";

export default function ResearchSourcesPanel({
  isMobile,
  ikLoading,
  ikSources,
  ikError,
  onClose,
}) {
  return (
    <>
      {isMobile && <div className="ast-panel-overlay-backdrop" onClick={onClose} aria-hidden="true" />}
      <div
        className={`ast-panel-r${isMobile ? "" : " ast-panel-r-narrow"}`}
        style={{
          width: 272,
          borderLeft: `1px solid ${C.border}`,
          background: C.bgPanel,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideIn 0.22s ease",
        }}
      >
        <div style={{ padding: "13px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ marginBottom: 8 }}><IndianKanoonAttribution compact /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.13em", textTransform: "uppercase" }}>Search Results</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {ikLoading && <Spinner />}
              {ikSources.length > 0 && <span style={{ fontSize: 10, color: C.gold, fontWeight: 600 }}>{ikSources.length}</span>}
              {isMobile && (
                <button type="button" onClick={onClose} aria-label="Close sources" style={{ background: "transparent", border: "none", color: C.textMut, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
                  ×
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: `${C.gold}0A`, border: `1px solid ${C.gold}22`, borderRadius: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ikSources.length > 0 ? C.green : C.textMut }} />
            <span style={{ fontSize: 9, color: C.gold, fontFamily: F.sans, letterSpacing: "0.06em" }}>
              {ikSources.length > 0
                ? (() => {
                    const st = ikSources.filter((s) => s.kind === "statute").length;
                    const ju = ikSources.length - st;
                    return [st ? `${st} statute${st > 1 ? "s" : ""}` : "", ju ? `${ju} judgment${ju > 1 ? "s" : ""}` : ""]
                      .filter(Boolean)
                      .join(" · ");
                  })()
                : "Awaiting query"}
            </span>
          </div>
          {ikError && (
            <div style={{ marginTop: 6, padding: "6px 8px", background: `${C.amber}0E`, border: `1px solid ${C.amber}33`, borderRadius: 4, fontSize: 9.5, color: C.amber, fontFamily: F.sans, lineHeight: 1.5 }}>
              {ikError}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "9px 11px" }}>
          {ikLoading && [1, 2, 3].map((i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 7, padding: "12px", marginBottom: 7 }}>
              <div style={{ height: 8, background: C.bgHover, borderRadius: 3, marginBottom: 6, width: "60%", animation: "shimmer 1.5s ease infinite" }} />
              <div style={{ height: 7, background: C.bgHover, borderRadius: 3, marginBottom: 4, width: "90%", animation: "shimmer 1.5s ease infinite" }} />
              <div style={{ height: 7, background: C.bgHover, borderRadius: 3, width: "70%", animation: "shimmer 1.5s ease infinite" }} />
            </div>
          ))}
          {!ikLoading && ikSources.length === 0 && (
            <div style={{ padding: "20px 8px", textAlign: "center", color: C.textMut, fontSize: 11, fontFamily: F.sans, lineHeight: 1.6 }}>
              Real IndianKanoon results appear here after your first query.
            </div>
          )}
          {!ikLoading && ikSources.map((src, i) => (
            <div
              key={src.id}
              style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 12px", marginBottom: 7, cursor: "pointer", transition: "border-color 0.15s", animation: `slideIn 0.28s ease ${i * 0.06}s both` }}
              onClick={() => window.open(src.url, "_blank", "noopener")}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, color: C.textMut, fontFamily: "monospace" }}>#{src.ref}</span>
                  <span style={{ fontSize: 8, color: src.kind === "statute" ? C.blue : C.textSec, background: src.kind === "statute" ? `${C.blue}18` : C.bgHover, border: `1px solid ${src.kind === "statute" ? `${C.blue}30` : C.border}`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.05em" }}>
                    {src.kind === "statute" ? "STATUTE" : "JUDGMENT"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {src.citedBy > 0 && <span style={{ fontSize: 9, color: C.textMut }} title={`Cited by ${src.citedBy.toLocaleString()} documents`}>🔗 {src.citedBy.toLocaleString()}</span>}
                  <span style={{ fontSize: 8, color: C.gold, background: `${C.gold}18`, border: `1px solid ${C.gold}30`, borderRadius: 3, padding: "1px 5px" }}>IK</span>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: C.textPri, fontFamily: F.sans, fontWeight: 500, lineHeight: 1.35, marginBottom: 4 }}>{src.title}</div>
              {src.citation && <div style={{ fontSize: 10, color: C.gold, fontFamily: "monospace", marginBottom: 4, fontStyle: "italic" }}>{src.citation}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: src.snippet ? 5 : 0 }}>
                <span style={{ fontSize: 9, color: C.textSec, fontFamily: F.sans }}>{src.court}</span>
                <span style={{ fontSize: 9, color: C.textMut, flexShrink: 0 }}>{src.date}</span>
              </div>
              {src.snippet && (
                <div style={{ fontSize: 10.5, color: C.textMut, fontFamily: F.sans, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 5, marginTop: 4 }}>
                  {src.snippet.slice(0, 180)}
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 9, color: C.gold, fontFamily: F.sans }}>Open on IndianKanoon ↗</div>
            </div>
          ))}
        </div>
        {ikSources.length > 0 && (
          <div style={{ padding: "9px 11px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Most Cited</div>
            {[...ikSources].sort((a, b) => b.citedBy - a.citedBy).slice(0, 3).map((src, i) => (
              <div key={src.id} onClick={() => window.open(src.url, "_blank", "noopener")} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: 3, background: C.bgCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.gold, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: C.textPri, fontFamily: F.sans, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{src.title}</div>
                  <div style={{ fontSize: 9, color: C.textMut }}>cited by {src.citedBy.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: "8px 11px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ padding: "7px 9px", background: `${C.amber}0E`, border: `1px solid ${C.amber}28`, borderRadius: 5 }}>
            <div style={{ fontSize: 9, color: C.amber, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>LAW TRANSITION</div>
            <p style={{ fontSize: 9.5, color: C.textMut, lineHeight: 1.5 }}>CrPC §482 → BNSS §528 from July 1, 2024.</p>
          </div>
        </div>
      </div>
    </>
  );
}
