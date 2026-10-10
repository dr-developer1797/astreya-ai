import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getWorkspaceByKey } from "./lib/workspace";
import { SEED_MATTERS } from "./lib/seedMatters";

const matterDoc = v.object({
  _id: v.id("matters"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  code: v.string(),
  label: v.string(),
  type: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("urgent"),
    v.literal("review"),
    v.literal("pending"),
    v.literal("closed"),
  ),
  court: v.string(),
  desc: v.string(),
  tasks: v.number(),
  updatedAt: v.number(),
});

export const ensure = mutation({
  args: {
    clientKey: v.string(),
    displayName: v.optional(v.string()),
  },
  returns: v.object({
    workspaceId: v.id("workspaces"),
    displayName: v.string(),
    selectedMatterId: v.union(v.id("matters"), v.null()),
    matters: v.array(matterDoc),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (args.clientKey.length < 16) {
      throw new Error("Invalid workspace key.");
    }

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_client_key", (q) => q.eq("clientKey", args.clientKey))
      .unique();

    let workspaceId = existing?._id;
    let created = false;

    if (!existing) {
      const now = Date.now();
      workspaceId = await ctx.db.insert("workspaces", {
        clientKey: args.clientKey,
        displayName: args.displayName?.trim() || "Astreya Workspace",
        createdAt: now,
      });
      created = true;

      const matterIds = [];
      for (const seed of SEED_MATTERS) {
        const id = await ctx.db.insert("matters", {
          workspaceId,
          ...seed,
          updatedAt: now,
        });
        matterIds.push(id);
      }

      await ctx.db.insert("workspacePrefs", {
        workspaceId,
        selectedMatterId: matterIds[0] ?? null,
      });
    } else if (args.displayName?.trim() && args.displayName !== existing.displayName) {
      await ctx.db.patch(existing._id, { displayName: args.displayName.trim() });
    }

    const workspace = await ctx.db.get("workspaces", workspaceId!);
    if (!workspace) throw new Error("Workspace initialization failed.");

    const matters = await ctx.db
      .query("matters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    const prefs = await ctx.db
      .query("workspacePrefs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .unique();

    let selectedMatterId = prefs?.selectedMatterId ?? matters[0]?._id ?? null;
    if (selectedMatterId && !matters.some((m) => m._id === selectedMatterId)) {
      selectedMatterId = matters[0]?._id ?? null;
      if (prefs) {
        await ctx.db.patch(prefs._id, { selectedMatterId });
      }
    }

    return {
      workspaceId: workspace._id,
      displayName: workspace.displayName,
      selectedMatterId,
      matters,
      created,
    };
  },
});

export const getProfile = query({
  args: { clientKey: v.string() },
  returns: v.union(
    v.object({
      workspaceId: v.id("workspaces"),
      displayName: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_client_key", (q) => q.eq("clientKey", args.clientKey))
      .unique();
    if (!workspace) return null;
    return { workspaceId: workspace._id, displayName: workspace.displayName };
  },
});

export const setDisplayName = mutation({
  args: {
    clientKey: v.string(),
    displayName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name = args.displayName.trim();
    if (name.length < 2) throw new Error("Display name is too short.");
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    await ctx.db.patch(workspace._id, { displayName: name });
    return null;
  },
});
