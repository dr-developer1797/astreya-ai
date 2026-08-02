import { verifyApiAccess } from "./auth.js";
import { checkRateLimit } from "./rateLimit.js";

/** Returns a Response when the request should be rejected, otherwise null. */
export function guardApiRequest(req: Request, route: string): Response | null {
  const auth = verifyApiAccess(req);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "anon";
  const rl = checkRateLimit(`${route}:${ip}`);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec ?? 60) },
      },
    );
  }

  return null;
}
