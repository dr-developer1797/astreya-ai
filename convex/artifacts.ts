import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMatterInWorkspace, getWorkspaceByKey } from "./lib/workspace";

const artifactKind = v.union(
  v.literal("research"),
  v.literal("draft"),
  v.literal("litigation"),
  v.literal("compliance"),
  v.literal("risk"),
);

const artifactDoc = v.object({
  _id: v.id("artifacts"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  matterId: v.id("matters"),
  kind: artifactKind,
  title: v.string(),
  content: v.string(),
  meta: v.optional(v.any()),
  createdAt: v.number(),
});

const ACTIVITY_BY_KIND: Record<string, { action: string; icon: string }> = {
  research: { action: "Research saved to matter", icon: "🔍" },
  draft: { action: "Draft saved to matter", icon: "📝" },
  litigation: { action: "Litigation strategy saved", icon: "⚖" },
  compliance: { action: "Compliance report saved", icon: "✅" },
  risk: { action: "Risk review saved", icon: "⚑" },
};

export const save = mutation({
  args: {
    clientKey: v.string(),
    matterId: v.id("matters"),
    kind: artifactKind,
    title: v.string(),
    content: v.string(),
    meta: v.optional(v.any()),
  },
  returns: v.id("artifacts"),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    await assertMatterInWorkspace(ctx, workspace._id, args.matterId);

    const title = args.title.trim();
    const content = args.content.trim();
    if (!title) throw new Error("Title is required.");
    if (!content) throw new Error("Nothing to save.");

    const now = Date.now();
    const artifactId = await ctx.db.insert("artifacts", {
      workspaceId: workspace._id,
      matterId: args.matterId,
      kind: args.kind,
      title,
      content,
      meta: args.meta,
      createdAt: now,
    });

    await ctx.db.patch(args.matterId, { updatedAt: now });

    const activity = ACTIVITY_BY_KIND[args.kind] ?? {
      action: "Work saved to matter",
      icon: "📎",
    };
    await ctx.db.insert("activities", {
      workspaceId: workspace._id,
      matterId: args.matterId,
      action: activity.action,
      icon: activity.icon,
      createdAt: now,
    });

    return artifactId;
  },
});

export const listForWorkspace = query({
  args: {
    clientKey: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(artifactDoc),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    const cap = Math.min(Math.max(args.limit ?? 100, 1), 200);
    const rows = await ctx.db
      .query("artifacts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .order("desc")
      .take(cap);
    return rows;
  },
});

export const listForMatter = query({
  args: {
    clientKey: v.string(),
    matterId: v.id("matters"),
    limit: v.optional(v.number()),
  },
  returns: v.array(artifactDoc),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    await assertMatterInWorkspace(ctx, workspace._id, args.matterId);
    const cap = Math.min(Math.max(args.limit ?? 50, 1), 100);
    return await ctx.db
      .query("artifacts")
      .withIndex("by_matter", (q) => q.eq("matterId", args.matterId))
      .order("desc")
      .take(cap);
  },
});
