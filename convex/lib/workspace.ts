import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export async function getWorkspaceByKey(ctx: Ctx, clientKey: string) {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_client_key", (q) => q.eq("clientKey", clientKey))
    .unique();
  if (!workspace) {
    throw new Error("Workspace not found. Refresh the app to re-initialize.");
  }
  return workspace;
}

export async function assertMatterInWorkspace(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
  matterId: Id<"matters">,
) {
  const matter = await ctx.db.get("matters", matterId);
  if (!matter || matter.workspaceId !== workspaceId) {
    throw new Error("Matter not found in this workspace.");
  }
  return matter;
}
