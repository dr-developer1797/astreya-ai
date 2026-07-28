const INDIAN_KANOON_URL = "https://api.indiankanoon.org/search/";
const MAX_QUERY_LENGTH = 500;

export async function POST(req: Request) {
  let payload: { query?: string; page?: number };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = payload.query?.trim();
  if (!query) {
    return Response.json({ error: "A search query is required." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: "Search query is too long." }, { status: 413 });
  }

  const apiKey =
    process.env.INDIAN_KANOON_API_KEY || process.env.IndiaKanoon_API_KEY;

  // Legal research still works through Gemma when optional case-law search is not configured.
  if (!apiKey) {
    return Response.json({ docs: [], configured: false });
  }

  const form = new URLSearchParams({
    formInput: query,
    pagenum: String(Math.max(0, Math.floor(payload.page || 0))),
  });

  let upstream: Response;
  try {
    upstream = await fetch(INDIAN_KANOON_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json({ error: "Indian Kanoon is temporarily unavailable." }, { status: 502 });
  }

  if (!upstream.ok) {
    return Response.json(
      { error: `Indian Kanoon request failed with status ${upstream.status}.` },
      { status: upstream.status },
    );
  }

  const result = (await upstream.json()) as { docs?: unknown[] };
  return Response.json({ docs: Array.isArray(result.docs) ? result.docs : [], configured: true });
}
