/** Maps legacy nav ids to App Router paths. */
export const NAV_ROUTES = {
  research: "/research",
  draft: "/draft",
  review: "/review",
  litigate: "/litigate",
  comply: "/comply",
  history: "/history",
  matters: "/matters",
};

export const PATH_TO_NAV = Object.fromEntries(
  Object.entries(NAV_ROUTES).map(([id, path]) => [path, id]),
);

export function navIdFromPath(pathname) {
  if (pathname === "/" || pathname === "") return "research";
  const base = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return PATH_TO_NAV[base] ?? "research";
}
