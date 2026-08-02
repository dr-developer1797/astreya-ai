/**
 * Optional API key gate for production. Set ASTREYA_API_KEY to require
 * `Authorization: Bearer <key>` or `x-astreya-key: <key>` on /api/* routes.
 */
export function verifyApiAccess(req) {
  const required = process.env.ASTREYA_API_KEY?.trim();
  if (!required) return { ok: true };

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerKey = req.headers.get("x-astreya-key")?.trim() ?? "";
  const key = bearer || headerKey;

  if (key && key === required) return { ok: true };
  return { ok: false, status: 401, message: "Unauthorized" };
}
