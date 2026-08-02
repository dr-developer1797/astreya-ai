"use client";

import { C } from "@/shared/constants/theme";

export default function ViewHeader({ crumbs = [], status, actions, className = "" }) {
  return (
    <div
      className={`ast-view-header ${className}`.trim()}
      style={{
        height: 52,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        background: C.bgPanel,
        flexShrink: 0,
      }}
    >
      <div
        className="ast-view-header-title"
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, minWidth: 0, flexWrap: "wrap" }}
      >
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <span style={{ color: C.textMut }}>›</span>}
            {crumb.onClick ? (
              <span
                onClick={crumb.onClick}
                style={{ color: C.textSec, cursor: "pointer" }}
                onMouseEnter={(e) => { e.target.style.color = C.textPri; }}
                onMouseLeave={(e) => { e.target.style.color = C.textSec; }}
              >
                {crumb.label}
              </span>
            ) : (
              <span style={{ color: crumb.muted ? C.textSec : C.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: crumb.maxWidth }}>{crumb.label}</span>
            )}
          </span>
        ))}
        {status}
      </div>
      {actions && (
        <div className="ast-view-header-actions" style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}
