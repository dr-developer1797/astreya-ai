"use client";

import { useState, useContext, useCallback, useEffect } from "react";
import {
  AssistantRuntimeProvider,
  useAui,
  useAuiState,
  useLocalRuntime,
} from "@assistant-ui/react";
import { C, F } from "@/shared/constants/theme";
import Btn from "@/shared/ui/Btn";
import ViewHeader from "@/shared/ui/ViewHeader";
import { ViewportContext } from "@/shared/hooks/useViewport";
import { researchAdapter, researchBridge } from "@/features/research/researchBridge";
import ResearchThread from "@/features/research/ResearchThread";
import ResearchSourcesPanel from "@/features/research/ResearchSourcesPanel";
import { DEMO_ANSWER, DEMO_SOURCES, SAMPLE_Q } from "@/features/research/demoScript";

function topicFromMessages(messages, isEmpty) {
  if (isEmpty) return "Legal Research";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "Legal Research";
  const text = (lastUser.content || [])
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
  if (!text) return "Legal Research";
  return text.length > 40 ? `${text.slice(0, 37)}…` : text;
}

function ResearchShell() {
  const { isMobile } = useContext(ViewportContext);
  const aui = useAui();
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const isEmpty = useAuiState((s) => s.thread.isEmpty);
  const messages = useAuiState((s) => s.thread.messages);

  const [srcOverride, setSrcOverride] = useState(undefined);
  const showSrc = srcOverride !== undefined ? srcOverride : !isMobile;

  const [ikSources, setIkSources] = useState([]);
  const [ikLoading, setIkLoading] = useState(false);
  const [ikError, setIkError] = useState("");
  const [ikGrounded, setIkGrounded] = useState(null);
  const [demoStreaming, setDemoStreaming] = useState(false);
  const [topicOverride, setTopicOverride] = useState(null);

  useEffect(() => {
    researchBridge.handlers = {
      onIkStart(query) {
        setIkLoading(true);
        setIkSources([]);
        setIkError("");
        setTopicOverride(query.length > 40 ? `${query.slice(0, 37)}…` : query);
      },
      onIkResult({ sources, grounded, error }) {
        setIkSources(sources);
        setIkGrounded(grounded);
        setIkError(error || "");
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
    return () => {
      researchBridge.handlers = {};
    };
  }, []);

  const topic = topicOverride ?? topicFromMessages(messages, isEmpty);

  const clearConversation = useCallback(() => {
    aui.threads.switchToNewThread();
    setIkSources([]);
    setIkError("");
    setIkGrounded(null);
    setIkLoading(false);
    setDemoStreaming(false);
    setTopicOverride(null);
    researchBridge.demoText = null;
  }, [aui]);

  const runDemo = useCallback(() => {
    if (isRunning || demoStreaming) return;
    researchBridge.demoText = DEMO_ANSWER;
    setIkError("");
    setIkGrounded(true);
    setIkSources(DEMO_SOURCES);
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
        status={busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ikLoading ? C.gold : C.red, animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: 9, color: ikLoading ? C.gold : C.red, letterSpacing: "0.08em" }}>
              {ikLoading ? "FETCHING CASES…" : "GENERATING…"}
            </span>
          </div>
        )}
        actions={
          <>
            {(() => {
              const ok = ikGrounded !== false;
              const tone = ok ? C.gold : C.amber;
              return (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", background: `${tone}12`, border: `1px solid ${tone}33`, borderRadius: 4 }}
                  title={ikError || "Answers grounded on live IndianKanoon sources"}
                >
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ikGrounded === null ? C.textMut : ok ? C.green : C.amber }} />
                  <span style={{ fontSize: 9, color: tone, letterSpacing: "0.07em", fontFamily: F.sans }}>
                    {ok ? "IndianKanoon Live" : "Ungrounded"}
                  </span>
                </div>
              );
            })()}
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
          <ResearchThread ikLoading={ikLoading} onClear={clearConversation} />
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
  const runtime = useLocalRuntime(researchAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ResearchShell />
    </AssistantRuntimeProvider>
  );
}
