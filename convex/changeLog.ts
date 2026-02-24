import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];
    return await ctx.db
      .query("changeLog")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(200);
  },
});

export const record = internalMutation({
  args: {
    projectId: v.id("projects"),
    itemId: v.optional(v.id("lineItems")),
    userId: v.string(),
    action: v.union(
      v.literal("edit"),
      v.literal("add"),
      v.literal("delete"),
      v.literal("note")
    ),
    field: v.optional(v.string()),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    itemDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("changeLog", {
      projectId: args.projectId,
      itemId: args.itemId,
      userId: args.userId,
      action: args.action,
      field: args.field,
      oldValue: args.oldValue,
      newValue: args.newValue,
      itemDescription: args.itemDescription,
      timestamp: Date.now(),
    });
  },
});
