import { query } from "./_generated/server";
import { v } from "convex/values";
import { assertMatterInWorkspace, getWorkspaceByKey } from "./lib/workspace";

const activityDoc = v.object({
  _id: v.id("activities"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  matterId: v.id("matters"),
  action: v.string(),
  icon: v.string(),
  createdAt: v.number(),
});

export const listForMatter = query({
  args: {
    clientKey: v.string(),
    matterId: v.id("matters"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityDoc),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByKey(ctx, args.clientKey);
    await assertMatterInWorkspace(ctx, workspace._id, args.matterId);
    const cap = Math.min(Math.max(args.limit ?? 20, 1), 50);
    return await ctx.db
      .query("activities")
      .withIndex("by_matter", (q) => q.eq("matterId", args.matterId))
      .order("desc")
      .take(cap);
  },
});
