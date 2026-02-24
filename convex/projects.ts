import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const getFiles = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];
    return await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    fileName: v.string(),
    fileId: v.optional(v.id("_storage")),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, { name, fileName, fileId, currency }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("projects", {
      userId,
      name,
      fileName,
      fileId,
      status: "uploading",
      currency: currency ?? "PLN",
      createdAt: Date.now(),
      fileCount: 0,
    });
  },
});

export const markCompleted = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(projectId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const addFile = mutation({
  args: {
    projectId: v.id("projects"),
    fileName: v.string(),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, { projectId, fileName, fileId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    await ctx.db.insert("projectFiles", {
      projectId,
      userId,
      fileName,
      fileId,
      status: "uploaded",
      createdAt: Date.now(),
    });

    // Update file count
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    await ctx.db.patch(projectId, { fileCount: files.length });

    return fileId;
  },
});

export const updateStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error")
    ),
    totalCost: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, status, totalCost, errorMessage }) => {
    const patch: Record<string, unknown> = { status };
    if (totalCost !== undefined) patch.totalCost = totalCost;
    if (errorMessage !== undefined) patch.errorMessage = errorMessage;
    if (status === "completed") patch.completedAt = Date.now();
    await ctx.db.patch(projectId, patch);
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    // Delete line items
    const items = await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete project files
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const f of files) {
      await ctx.storage.delete(f.fileId);
      await ctx.db.delete(f._id);
    }

    // Delete legacy storage file
    if (project.fileId) {
      try { await ctx.storage.delete(project.fileId); } catch {}
    }

    await ctx.db.delete(projectId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
