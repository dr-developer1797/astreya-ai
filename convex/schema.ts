import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const matterStatus = v.union(
  v.literal("active"),
  v.literal("urgent"),
  v.literal("review"),
  v.literal("pending"),
  v.literal("closed"),
);

const artifactKind = v.union(
  v.literal("research"),
  v.literal("draft"),
  v.literal("litigation"),
  v.literal("compliance"),
  v.literal("risk"),
);

export default defineSchema({
  workspaces: defineTable({
    clientKey: v.string(),
    displayName: v.string(),
    createdAt: v.number(),
  }).index("by_client_key", ["clientKey"]),

  matters: defineTable({
    workspaceId: v.id("workspaces"),
    code: v.string(),
    label: v.string(),
    type: v.string(),
    status: matterStatus,
    court: v.string(),
    desc: v.string(),
    tasks: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  workspacePrefs: defineTable({
    workspaceId: v.id("workspaces"),
    selectedMatterId: v.union(v.id("matters"), v.null()),
  }).index("by_workspace", ["workspaceId"]),

  artifacts: defineTable({
    workspaceId: v.id("workspaces"),
    matterId: v.id("matters"),
    kind: artifactKind,
    title: v.string(),
    content: v.string(),
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId", "createdAt"])
    .index("by_matter", ["matterId", "createdAt"]),

  activities: defineTable({
    workspaceId: v.id("workspaces"),
    matterId: v.id("matters"),
    action: v.string(),
    icon: v.string(),
    createdAt: v.number(),
  }).index("by_matter", ["matterId", "createdAt"]),

  researchState: defineTable({
    workspaceId: v.id("workspaces"),
    payload: v.string(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),
});
