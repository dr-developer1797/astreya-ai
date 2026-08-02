export function logApiEvent(event, data = {}) {
  console.info(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}
