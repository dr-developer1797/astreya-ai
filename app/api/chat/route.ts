const DEFAULT_LMSTUDIO_PORT = "1234";

// Accepts anything from "10.0.0.5" to "http://10.0.0.5:1234/v1", filling in the scheme,
// LM Studio's default port and the /v1 path. Without this, dropping ":1234" while editing
// the IP silently retargets port 80 and every request fails to connect.
function normalizeEndpoint(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`);
    if (!url.port) url.port = DEFAULT_LMSTUDIO_PORT;
    const path = url.pathname.replace(/\/+$/, "");
    url.pathname = path.endsWith("/v1") ? path : `${path}/v1`;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isAllowedLocalEndpoint(endpoint: string): boolean {
  try {
    const { hostname } = new URL(endpoint);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }
    // Private / link-local ranges (LM Studio on LAN IP, e.g. 10.x.x.x)
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let payload: {
    endpoint?: string;
    model?: string;
    messages?: { role: string; content: string }[];
    sys?: string;
    stream?: boolean;
    max_tokens?: number;
    reasoning_effort?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { endpoint, model, messages, sys, stream = true, max_tokens = 2000, reasoning_effort } = payload;

  // Server config is authoritative so the host address lives in one place and never gets
  // baked into the browser bundle; a client-supplied endpoint is only an optional override.
  const requested = endpoint || process.env.LMSTUDIO_ENDPOINT || "127.0.0.1";
  const base = normalizeEndpoint(requested);

  if (!base || !isAllowedLocalEndpoint(base)) {
    return Response.json(
      { error: `Endpoint must be a local or private-network address (got "${requested}")` },
      { status: 400 },
    );
  }

  if (!model || !messages?.length) {
    return Response.json({ error: "model and messages are required" }, { status: 400 });
  }

  const body = {
    model,
    max_tokens,
    stream,
    ...(reasoning_effort ? { reasoning_effort } : {}),
    messages: sys
      ? [{ role: "system", content: sys }, ...messages]
      : messages,
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return Response.json(
      { error: `Cannot reach local LLM at ${base}. Is the server running? (${message})` },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
    });
  }

  if (stream && upstream.body) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return new Response(await upstream.text(), {
    headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
  });
}
