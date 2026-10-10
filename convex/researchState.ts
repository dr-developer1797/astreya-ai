import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getWorkspaceByKey } from "./lib/workspace";

const MAX_PAYLOAD_CHARS = 500_000;

export const get = query({
  args: { clientKey: v.string() },
  returns: v.union(
    v.object({
      payload: v.string(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    const row = await ctx.db
      .query("researchState")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .unique();
    if (!row) return null;
    return { payload: row.payload, updatedAt: row.updatedAt };
  },
});

export const save = mutation({
  args: {
    clientKey: v.string(),
    payload: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.payload.length > MAX_PAYLOAD_CHARS) {
      throw new Error("Research thread is too large to persist.");
    }
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    const now = Date.now();
    const existing = await ctx.db
      .query("researchState")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { payload: args.payload, updatedAt: now });
    } else {
      await ctx.db.insert("researchState", {
        workspaceId: workspace._id,
        payload: args.payload,
        updatedAt: now,
      });
    }
    return null;
  },
});
