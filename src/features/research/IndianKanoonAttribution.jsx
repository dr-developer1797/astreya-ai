import { C, F } from "@/shared/constants/theme";

/** Required attribution when rendering Indian Kanoon API data (search, RAG context, etc.). */
export default function IndianKanoonAttribution({ compact = false }) {
  return (
    <a
      href="https://indiankanoon.org/"
      target="_blank"
      rel="noopener noreferrer"
      title="Indian Kanoon — open access Indian legal database"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 4 : 6,
        padding: compact ? "3px 7px" : "5px 10px",
        background: `${C.gold}10`,
        border: `1px solid ${C.gold}33`,
        borderRadius: 4,
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: compact ? 8 : 9,
          color: C.textMut,
          letterSpacing: "0.04em",
          fontFamily: F.sans,
          textTransform: "uppercase",
        }}
      >
        Powered by
      </span>
      <span
        style={{
          fontSize: compact ? 9 : 10,
          color: C.gold,
          fontWeight: 600,
          letterSpacing: "0.02em",
          fontFamily: F.sans,
        }}
      >
        Indian Kanoon
      </span>
    </a>
  );
}
