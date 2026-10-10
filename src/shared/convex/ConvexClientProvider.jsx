"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const client = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({ children }) {
  if (!client) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui", color: "#ccc", background: "#0F1016", minHeight: "100vh" }}>
        Missing <code>NEXT_PUBLIC_CONVEX_URL</code>. Run <code>npx convex dev</code> and add the URL to <code>.env.local</code>.
      </div>
    );
  }
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
