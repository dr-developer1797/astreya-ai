import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertMatterInWorkspace, getWorkspaceByKey } from "./lib/workspace";

const matterStatus = v.union(
  v.literal("active"),
  v.literal("urgent"),
  v.literal("review"),
  v.literal("pending"),
  v.literal("closed"),
);

const matterDoc = v.object({
  _id: v.id("matters"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  code: v.string(),
  label: v.string(),
  type: v.string(),
  status: matterStatus,
  court: v.string(),
  desc: v.string(),
  tasks: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { clientKey: v.string() },
  returns: v.array(matterDoc),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    return await ctx.db
      .query("matters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    clientKey: v.string(),
    label: v.string(),
    type: v.string(),
    court: v.optional(v.string()),
    desc: v.optional(v.string()),
  },
  returns: v.id("matters"),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    const label = args.label.trim();
    if (label.length < 3) throw new Error("Matter title is too short.");

    const existing = await ctx.db
      .query("matters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    const year = new Date().getFullYear();
    const seq = String(existing.length + 1).padStart(4, "0");
    const now = Date.now();

    const matterId = await ctx.db.insert("matters", {
      workspaceId: workspace._id,
      code: `AST-${year}-${seq}`,
      label,
      type: args.type.trim() || "General",
      status: "active",
      court: args.court?.trim() || "N/A",
      desc: args.desc?.trim() || "New matter created in Astreya.",
      tasks: 0,
      updatedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: workspace._id,
      matterId,
      action: "Matter created",
      icon: "📁",
      createdAt: now,
    });

    return matterId;
  },
});

export const setSelected = mutation({
  args: {
    clientKey: v.string(),
    matterId: v.id("matters"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    await assertMatterInWorkspace(ctx, workspace._id, args.matterId);

    const prefs = await ctx.db
      .query("workspacePrefs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .unique();

    if (prefs) {
      await ctx.db.patch(prefs._id, { selectedMatterId: args.matterId });
    } else {
      await ctx.db.insert("workspacePrefs", {
        workspaceId: workspace._id,
        selectedMatterId: args.matterId,
      });
    }
    return null;
  },
});

export const getSelected = query({
  args: { clientKey: v.string() },
  returns: v.union(v.id("matters"), v.null()),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    const prefs = await ctx.db
      .query("workspacePrefs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .unique();
    return prefs?.selectedMatterId ?? null;
  },
});
