const GEMMA_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const MAX_INPUT_CHARS = 120_000;
const MAX_OUTPUT_TOKENS = 8192;
const DEFAULT_OUTPUT_TOKENS = 2000;
const CONNECT_TIMEOUT_MS = 20_000;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_BASE_MS = 700;
const MAX_RETRY_DELAY_MS = 5_000;
const MAX_ATTEMPTS = 4;

export const maxDuration = 60;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type TextBlock = { type: "text"; text: string };

type Step = {
  type: "user_input" | "model_output";
  content: TextBlock[];
};

// "structured" sends real turns, which is what gemma-4-26b-a4b-it accepts. "flat" is the
// string form, kept only to recover if GEMMA_MODEL points at a model that rejects turns.
type BodyMode = "structured" | "flat";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

function toSteps(messages: ChatMessage[]): Step[] {
  return messages.map(({ role, content }) => ({
    type: role === "assistant" ? "model_output" : "user_input",
    content: [{ type: "text", text: content }],
  }));
}

// Fallback only. Role labels are inlined as text here, so a message containing "USER:"
// can forge a turn boundary — which is why the structured form is preferred.
function flattenConversation(messages: ChatMessage[]): string {
  return messages
    .map(({ role, content }) => `${role === "assistant" ? "ASSISTANT" : "USER"}:\n${content}`)
    .join("\n\n");
}

function buildBody(
  mode: BodyMode,
  messages: ChatMessage[],
  sys: string | undefined,
  stream: boolean,
  maxOutputTokens: number,
) {
  return {
    model: process.env.GEMMA_MODEL || DEFAULT_MODEL,
    input: mode === "structured" ? toSteps(messages) : flattenConversation(messages),
    ...(sys ? { system_instruction: sys } : {}),
    stream,
    store: false,
    // gemma-4-26b-a4b-it rejects thinking_level and thinking_summaries, so its hidden
    // reasoning cannot be bounded here and is charged against max_output_tokens.
    generation_config: { max_output_tokens: maxOutputTokens },
  };
}

function openAIChunk(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

function emitEvent(
  event: string,
  controller: TransformStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  const data = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") return;

  let parsed: {
    event_type?: string;
    delta?: { type?: string; text?: string };
    error?: { message?: string };
  };

  try {
    parsed = JSON.parse(data);
  } catch {
    return; // Keepalive or comment frame.
  }

  if (parsed.event_type === "step.delta" && parsed.delta?.type === "text" && parsed.delta.text) {
    controller.enqueue(encoder.encode(openAIChunk(parsed.delta.text)));
  } else if (parsed.event_type === "error") {
    controller.enqueue(
      encoder.encode(openAIChunk(`\n\n⚠ ${parsed.error?.message || "Gemma stream failed"}`)),
    );
  }
}

// Rewrites Google's interaction SSE events into the OpenAI-style chunks the client reads.
function toOpenAIStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";
        for (const event of events) emitEvent(event, controller, encoder);
      },
      flush(controller) {
        buffer += decoder.decode();
        if (buffer.trim()) emitEvent(buffer, controller, encoder);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      },
    }),
  );
}

function extractText(result: unknown): string {
  const payload = (result ?? {}) as {
    output_text?: unknown;
    steps?: unknown;
  };

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  // Older/edge responses omit output_text and only carry the model_output steps.
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  return steps
    .filter((step): step is Step => (step as Step)?.type === "model_output")
    .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
    .filter((block): block is TextBlock => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayFor(res: Response, attempt: number): number {
  const header = Number(res.headers.get("retry-after"));
  const suggested = Number.isFinite(header) && header > 0 ? header * 1000 : RETRY_BASE_MS * attempt;
  return Math.min(suggested, MAX_RETRY_DELAY_MS);
}

class GemmaConnectionError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "GemmaConnectionError";
    this.retryable = retryable;
  }
}

async function sendToGemma(
  body: unknown,
  apiKey: string,
  clientSignal: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  if (clientSignal.aborted) controller.abort();
  else clientSignal.addEventListener("abort", () => controller.abort(), { once: true });

  // Time-box the connection only. Leaving the timer armed would abort the response
  // body partway through generation and truncate long documents without an error.
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CONNECT_TIMEOUT_MS);

  try {
    return await fetch(GEMMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    // A second 20s connect attempt would risk the whole function budget, so a timeout
    // is reported immediately while ordinary socket errors stay retryable.
    if (timedOut) {
      throw new GemmaConnectionError(
        "Gemma did not start responding in time. It may be rate limited — try again.",
        false,
      );
    }
    throw new GemmaConnectionError(
      err instanceof Error ? err.message : "Connection failed",
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function errorMessageFrom(res: Response): Promise<string> {
  const detail = (await res.text()).trim();
  if (!detail) return "";

  // A failed streaming request reports the problem as an SSE error event rather than a
  // JSON body, so unwrap the data frames before parsing or the caller surfaces raw SSE.
  const payload =
    detail.startsWith("event:") || detail.startsWith("data:")
      ? detail
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("")
      : detail;

  try {
    const parsed = JSON.parse(payload) as { error?: { message?: string } };
    return parsed.error?.message || payload;
  } catch {
    return payload || detail;
  }
}

type UpstreamResult =
  | { ok: true; upstream: Response }
  | { ok: false; response: Response };

async function resolveUpstream(
  messages: ChatMessage[],
  sys: string | undefined,
  stream: boolean,
  maxOutputTokens: number,
  apiKey: string,
  clientSignal: AbortSignal,
): Promise<UpstreamResult> {
  let mode: BodyMode = "structured";
  let transientRetryUsed = false;
  let flatFallbackUsed = false;

  // Bounded by MAX_ATTEMPTS plus the two one-shot recovery paths below.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let upstream: Response;

    try {
      upstream = await sendToGemma(
        buildBody(mode, messages, sys, stream, maxOutputTokens),
        apiKey,
        clientSignal,
      );
    } catch (err) {
      if (clientSignal.aborted) {
        return { ok: false, response: new Response(null, { status: 499 }) };
      }

      const retryable = err instanceof GemmaConnectionError ? err.retryable : true;
      if (retryable && !transientRetryUsed) {
        transientRetryUsed = true;
        await delay(RETRY_BASE_MS);
        continue;
      }

      const message = err instanceof Error ? err.message : "Connection failed";
      return {
        ok: false,
        response: Response.json(
          { error: `Cannot reach the Google AI Studio Gemma API. ${message}` },
          { status: 502 },
        ),
      };
    }

    if (upstream.ok) return { ok: true, upstream };

    // A 400 on structured turns means the configured model wants the string form.
    if (upstream.status === 400 && mode === "structured" && !flatFallbackUsed) {
      flatFallbackUsed = true;
      mode = "flat";
      console.warn(`Gemma rejected structured input, retrying flat: ${await errorMessageFrom(upstream)}`);
      continue;
    }

    if (RETRY_STATUS.has(upstream.status) && !transientRetryUsed) {
      transientRetryUsed = true;
      const wait = retryDelayFor(upstream, attempt);
      await upstream.body?.cancel();
      await delay(wait);
      continue;
    }

    const message = await errorMessageFrom(upstream);
    return {
      ok: false,
      response: Response.json(
        { error: message || "Gemma request failed." },
        { status: upstream.status },
      ),
    };
  }

  return {
    ok: false,
    response: Response.json(
      { error: "Gemma did not return a usable response. Please try again." },
      { status: 502 },
    ),
  };
}

export async function POST(req: Request) {
  let payload: {
    messages?: unknown;
    sys?: unknown;
    stream?: unknown;
    max_tokens?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Gemma is not configured. Add GEMINI_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    return Response.json({ error: "At least one valid chat message is required." }, { status: 400 });
  }

  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > MAX_INPUT_CHARS) {
    return Response.json({ error: "Conversation is too long." }, { status: 413 });
  }

  const stream = payload.stream !== false;
  const sys = typeof payload.sys === "string" && payload.sys.trim() ? payload.sys.trim() : undefined;
  const requestedTokens = payload.max_tokens;
  const maxOutputTokens =
    typeof requestedTokens === "number" && Number.isFinite(requestedTokens) && requestedTokens >= 1
      ? Math.min(Math.trunc(requestedTokens), MAX_OUTPUT_TOKENS)
      : DEFAULT_OUTPUT_TOKENS;

  const result = await resolveUpstream(
    messages,
    sys,
    stream,
    maxOutputTokens,
    apiKey,
    req.signal,
  );
  if (!result.ok) return result.response;

  const upstream = result.upstream;

  if (stream && upstream.body) {
    return new Response(toOpenAIStream(upstream.body), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const completion = await upstream.json();
  return Response.json({
    choices: [{ message: { role: "assistant", content: extractText(completion) } }],
  });
}
