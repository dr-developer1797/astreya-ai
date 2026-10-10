"use client";

import { useState, useContext, useCallback, useEffect, useMemo } from "react";
import { useAui, useAuiState } from "@assistant-ui/react";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import ViewHeader from "@/shared/ui/ViewHeader";
import { ViewportContext } from "@/shared/hooks/useViewport";
import { researchBridge } from "@/features/research/researchBridge";
import ResearchThread from "@/features/research/ResearchThread";
import ResearchSourcesPanel from "@/features/research/ResearchSourcesPanel";
import { DEMO_ANSWER, DEMO_SOURCES, SAMPLE_Q } from "@/features/research/demoScript";
import { useSaveArtifact } from "@/shared/convex/useSaveArtifact";

function messageText(message) {
  if (!message?.content) return "";
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function topicFromMessages(messages, isEmpty) {
  if (isEmpty) return "Legal Research";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = messageText(lastUser);
  if (!text) return "Legal Research";
  return text.length > 40 ? `${text.slice(0, 37)}…` : text;
}

function ResearchShell() {
  const { isMobile } = useContext(ViewportContext);
  const aui = useAui();
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const isEmpty = useAuiState((s) => s.thread.isEmpty);
  const messages = useAuiState((s) => s.thread.messages);
  const { saveArtifact, saving, lastError: saveError } = useSaveArtifact();

  const [srcOverride, setSrcOverride] = useState(undefined);
  const showSrc = srcOverride !== undefined ? srcOverride : !isMobile;

  const [ikLoading, setIkLoading] = useState(false);
  const [liveFetchSources, setLiveFetchSources] = useState([]);
  const [liveFetchError, setLiveFetchError] = useState("");
  const [demoStreaming, setDemoStreaming] = useState(false);
  const [topicOverride, setTopicOverride] = useState(null);
  const [focusedMessageId, setFocusedMessageId] = useState(null);
  const [saveNotice, setSaveNotice] = useState("");

  const focusedAssistant = useMemo(() => {
    const assistants = messages.filter((m) => m.role === "assistant");
    if (focusedMessageId) {
      return assistants.find((m) => m.id === focusedMessageId) ?? null;
    }
    return assistants.length > 0 ? assistants[assistants.length - 1] : null;
  }, [messages, focusedMessageId]);

  const panelSources = useMemo(() => {
    if (ikLoading) {
      return {
        sources: liveFetchSources,
        error: liveFetchError,
        grounded: liveFetchSources.length > 0 ? true : null,
      };
    }
    const custom = focusedAssistant?.metadata?.custom;
    if (custom?.ikSources?.length) {
      return {
        sources: custom.ikSources,
        error: custom.ikError || "",
        grounded: custom.ikGrounded ?? null,
      };
    }
    return {
      sources: liveFetchSources,
      error: liveFetchError,
      grounded: liveFetchSources.length > 0 ? true : null,
    };
  }, [focusedAssistant, ikLoading, liveFetchError, liveFetchSources]);

  const ikSources = panelSources.sources;
  const ikError = panelSources.error;
  const ikGrounded = panelSources.grounded;

  useEffect(() => {
    researchBridge.handlers = {
      onIkStart(query) {
        setIkLoading(true);
        setLiveFetchSources([]);
        setLiveFetchError("");
        setTopicOverride(query.length > 40 ? `${query.slice(0, 37)}…` : query);
      },
      onIkResult({ sources, grounded, error }) {
        setLiveFetchSources(sources);
        setLiveFetchError(error || "");
        if (grounded === false) setFocusedMessageId(null);
      },
      onIkDone() {
        setIkLoading(false);
      },
      onDemoStart() {
        setDemoStreaming(true);
        setIkLoading(false);
      },
      onDemoDone() {
        setDemoStreaming(false);
      },
    };
    researchBridge.focusMessage = (id) => setFocusedMessageId(id);
    return () => {
      researchBridge.handlers = {};
      researchBridge.focusMessage = null;
    };
  }, []);

  const saveFocusedAnswer = useCallback(async () => {
    const text = messageText(focusedAssistant);
    if (!text) return;
    setSaveNotice("");
    try {
      await saveArtifact({
        kind: "research",
        title: topicFromMessages(messages, isEmpty),
        content: text,
        meta: {
          sources: focusedAssistant?.metadata?.custom?.ikSources ?? ikSources,
        },
      });
      setSaveNotice("Saved to active matter.");
    } catch {
      /* useSaveArtifact sets lastError */
    }
  }, [focusedAssistant, ikSources, isEmpty, messages, saveArtifact]);

  useEffect(() => {
    researchBridge.saveFocusedAnswer = () => {
      void saveFocusedAnswer();
    };
    return () => {
      researchBridge.saveFocusedAnswer = null;
    };
  }, [saveFocusedAnswer]);

  const topic = topicOverride ?? topicFromMessages(messages, isEmpty);

  const clearConversation = useCallback(() => {
    aui.threads.switchToNewThread();
    setLiveFetchSources([]);
    setLiveFetchError("");
    setIkLoading(false);
    setDemoStreaming(false);
    setTopicOverride(null);
    setFocusedMessageId(null);
    setSaveNotice("");
    researchBridge.demoText = null;
  }, [aui]);

  const runDemo = useCallback(() => {
    if (isRunning || demoStreaming) return;
    researchBridge.demoText = DEMO_ANSWER;
    setLiveFetchError("");
    setLiveFetchSources(DEMO_SOURCES);
    setTopicOverride("Criminal Procedure");
    aui.threads.switchToNewThread();
    queueMicrotask(() => {
      aui.thread.append(SAMPLE_Q);
    });
  }, [aui, demoStreaming, isRunning]);

  const busy = isRunning || demoStreaming || ikLoading;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ViewHeader
        crumbs={[
          { label: "Research", muted: true },
          { label: topic, maxWidth: 240 },
        ]}
        status={
          <>
            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: ikLoading ? C.gold : C.red, animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 9, color: ikLoading ? C.gold : C.red, letterSpacing: "0.08em" }}>
                  {ikLoading ? "FETCHING CASES…" : "GENERATING…"}
                </span>
              </div>
            )}
            {(saveNotice || saveError) && (
              <span style={{ fontSize: 9, color: saveError ? C.amber : C.green, marginLeft: 6, letterSpacing: "0.06em" }}>
                {saveError || saveNotice}
              </span>
            )}
          </>
        }
        actions={
          <>
            {(() => {
              const ok = ikGrounded !== false;
              const tone = ok ? C.gold : C.amber;
              return (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", background: `${tone}12`, border: `1px solid ${tone}33`, borderRadius: 4 }}
                  title={ikError || "Sources match the focused assistant answer"}
                >
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ikGrounded === null ? C.textMut : ok ? C.green : C.amber }} />
                  <span style={{ fontSize: 9, color: tone, letterSpacing: "0.07em", fontFamily: F.sans }}>
                    {ok ? "IndianKanoon Live" : "Ungrounded"}
                  </span>
                </div>
              );
            })()}
            <Btn onClick={() => void saveFocusedAnswer()} disabled={saving || !messageText(focusedAssistant)}>
              {saving ? "Saving…" : "Save to Matter"}
            </Btn>
            <Btn onClick={runDemo} className="ast-hide-mobile">↻ Demo Mode</Btn>
            <Btn
              onClick={() => setSrcOverride((prev) => !(prev !== undefined ? prev : !isMobile))}
              style={showSrc ? { borderColor: C.red, color: C.red, background: C.redFaint } : {}}
            >
              {showSrc ? "Hide Sources" : "Sources"}{ikSources.length > 0 ? ` (${ikSources.length})` : ""}
            </Btn>
          </>
        }
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <ResearchThread ikLoading={ikLoading} onClear={clearConversation} focusedMessageId={focusedMessageId} />
        </div>
        {showSrc && (
          <ResearchSourcesPanel
            isMobile={isMobile}
            ikLoading={ikLoading}
            ikSources={ikSources}
            ikError={ikError}
            onClose={() => setSrcOverride(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function ResearchView() {
  return <ResearchShell />;
}
