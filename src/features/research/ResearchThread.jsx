"use client";

import Image from "next/image";
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import { researchBridge } from "@/features/research/researchBridge";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import Markdown from "@/shared/ui/Markdown";
import Spinner from "@/shared/ui/Spinner";
import IndianKanoonAttribution from "@/features/research/IndianKanoonAttribution";
import { SUGGESTION_PROMPTS } from "@/features/research/demoScript";

function ResearchMarkdown({ text }) {
  return <Markdown text={text || ""} variant="research" />;
}

function UserMessage() {
  return (
    <MessagePrimitive.Root style={{ marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          className="ast-user-bubble"
          style={{
            maxWidth: "72%",
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: "10px 10px 2px 10px",
            padding: "11px 15px",
          }}
        >
          <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
            Query
          </div>
          <MessagePrimitive.Parts
            components={{
              Text: ({ text }) => (
                <p style={{ fontSize: 13, color: C.textPri, lineHeight: 1.6, fontFamily: F.sans, fontWeight: 300, margin: 0, whiteSpace: "pre-wrap" }}>
                  {text}
                </p>
              ),
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage({ ikLoading, focusedMessageId }) {
  const messageId = useAuiState((s) => s.message.id);
  const isFocused = useAuiState((s) => {
    const assistants = s.thread.messages.filter((m) => m.role === "assistant");
    const lastId = assistants[assistants.length - 1]?.id;
    const active = focusedMessageId ?? lastId;
    return active === s.message.id;
  });
  return (
    <MessagePrimitive.Root
      style={{
        marginBottom: 20,
        animation: "fadeUp 0.3s ease",
        outline: "none",
        borderRadius: 8,
        boxShadow: isFocused ? `inset 0 0 0 1px ${C.redGlow}` : "none",
        cursor: "pointer",
      }}
      onClick={() => {
        researchBridge.focusMessage?.(messageId);
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <Image
          src="/astreya-logo-dark.png"
          alt=""
          width={631}
          height={521}
          style={{ width: 26, height: 21, objectFit: "contain", flexShrink: 0, marginTop: 5 }}
        />
        <div className="ast-answer-col" style={{ flex: 1, maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.textPri, fontWeight: 600 }}>Astreya</span>
            <span style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.08em" }}>INDIAN LAW RESEARCH</span>
            <AuiIf condition={(s) => s.message.status?.type === "running"}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: C.red,
                    animation: `shimmer 1.2s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </AuiIf>
          </div>
          <AuiIf condition={(s) => s.message.status?.type === "running"}>
            <MessagePrimitive.If hasContent={false}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <Spinner />
                <span style={{ fontSize: 11, color: C.textMut, fontFamily: F.sans }}>
                  {ikLoading ? "Searching IndianKanoon…" : "Analysing…"}
                </span>
              </div>
            </MessagePrimitive.If>
          </AuiIf>
          <div style={{ fontFamily: F.sans }}>
            <MessagePrimitive.Parts components={{ Text: ResearchMarkdown }} />
            <MessagePrimitive.Error>
              <ErrorPrimitive.Root
                role="alert"
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  border: `1px solid ${C.redGlow}`,
                  borderRadius: 6,
                  background: C.redFaint,
                  color: C.red,
                  fontSize: 11,
                  lineHeight: 1.55,
                }}
              >
                Research failed: <ErrorPrimitive.Message />
              </ErrorPrimitive.Root>
            </MessagePrimitive.Error>
          </div>
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            style={{ display: "flex", gap: 5, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${C.border}` }}
          >
            <ActionBarPrimitive.Copy asChild>
              <Btn>Copy</Btn>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
              <Btn>Regenerate</Btn>
            </ActionBarPrimitive.Reload>
            <Btn
              onClick={(e) => {
                e.stopPropagation();
                researchBridge.focusMessage?.(messageId);
                researchBridge.saveFocusedAnswer?.();
              }}
            >
              Save to Matter
            </Btn>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function Welcome() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, padding: "24px 0" }}>
      <div style={{ width: 48, height: 48, background: C.redFaint, border: `1px solid ${C.redGlow}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Image src="/astreya-logo-light.png" alt="" width={635} height={520} style={{ width: 26, height: 21, objectFit: "contain" }} />
      </div>
      <div style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 600, color: C.textPri }}>Ask Astreya anything</div>
      <p style={{ fontSize: 12, color: C.textSec, fontFamily: F.sans, fontWeight: 300, textAlign: "center", maxWidth: 380, lineHeight: 1.6, marginBottom: 4 }}>
        Answers drawn from live Indian statutes and case law.
      </p>
      <IndianKanoonAttribution />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 480, marginTop: 4 }}>
        {SUGGESTION_PROMPTS.map((prompt) => (
          <ThreadPrimitive.Suggestion
            key={prompt}
            prompt={prompt}
            send
            style={{
              fontSize: 11,
              color: C.textSec,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              padding: "5px 11px",
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.14s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.red;
              e.currentTarget.style.color = C.red;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textSec;
            }}
          >
            {prompt}
          </ThreadPrimitive.Suggestion>
        ))}
      </div>
    </div>
  );
}

function Composer({ tags = ["CrPC", "BNS", "IBC", "DPDP"] }) {
  const aui = useAui();

  const appendTag = (tag) => {
    const current = aui.composer.getState().text || "";
    aui.composer.setText(current ? `${current} ${tag}` : tag);
  };

  return (
    <ComposerPrimitive.Root className="ast-input-bar" style={{ padding: "13px 22px", borderTop: `1px solid ${C.border}`, background: C.bgPanel, flexShrink: 0 }}>
      <div className="ast-input-row" style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <div
          style={{
            flex: 1,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "9px 13px",
            display: "flex",
            alignItems: "center",
            gap: 9,
            minWidth: 0,
          }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = C.borderMid; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = C.border; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMut} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <ComposerPrimitive.Input
            placeholder="Ask a legal question…"
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12.5,
              color: C.textPri,
              fontFamily: F.sans,
              fontWeight: 300,
              minWidth: 0,
              resize: "none",
              lineHeight: 1.4,
            }}
          />
          <div className="ast-input-tags" style={{ display: "flex", gap: 5 }}>
            {tags.map((t) => (
              <span
                key={t}
                onClick={() => appendTag(t)}
                style={{
                  fontSize: 9,
                  color: C.textMut,
                  background: C.bgHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: "2px 6px",
                  cursor: "pointer",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <AuiIf condition={(s) => s.composer.canCancel}>
          <ComposerPrimitive.Cancel asChild>
            <Btn>Stop</Btn>
          </ComposerPrimitive.Cancel>
        </AuiIf>
        <AuiIf condition={(s) => !s.composer.canCancel}>
          <ComposerPrimitive.Send asChild>
            <Btn primary>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search
            </Btn>
          </ComposerPrimitive.Send>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  );
}

export default function ResearchThread({ ikLoading, onClear, focusedMessageId }) {
  return (
    <ThreadPrimitive.Root
      style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", ["--thread-max-width"]: "680px" }}
    >
      <ThreadPrimitive.Viewport
        className="ast-content-pad"
        style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column" }}
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <Welcome />
        </AuiIf>
        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? (
              <UserMessage />
            ) : (
              <AssistantMessage ikLoading={ikLoading} focusedMessageId={focusedMessageId} />
            )
          }
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ViewportFooter>
        <Composer />
        <AuiIf condition={(s) => !s.thread.isEmpty}>
          <div style={{ padding: "0 22px 10px", background: C.bgPanel }}>
            <span
              onClick={onClear}
              style={{ fontSize: 10, color: C.textMut, cursor: "pointer", fontFamily: F.sans }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.textSec; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textMut; }}
            >
              ✕ Clear conversation
            </span>
          </div>
        </AuiIf>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  );
}
