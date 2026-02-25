import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];
    return await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const update = mutation({
  args: {
    itemId: v.id("lineItems"),
    quantity: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, quantity, unitPrice, description, category, unit, note }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Not found");

    const newQty = quantity ?? item.quantity;
    const newPrice = unitPrice ?? item.unitPrice;
    const patch: Record<string, unknown> = {
      totalPrice: Math.round(newQty * newPrice * 100) / 100,
    };
    if (quantity !== undefined) patch.quantity = quantity;
    if (unitPrice !== undefined) patch.unitPrice = unitPrice;
    if (description !== undefined) patch.description = description;
    if (category !== undefined) patch.category = category;
    if (unit !== undefined) patch.unit = unit;
    if (note !== undefined) patch.note = note;

    await ctx.db.patch(itemId, patch);

    // Record changes to changelog
    const changes: { field: string; old: string; new_: string }[] = [];
    if (quantity !== undefined && quantity !== item.quantity)
      changes.push({ field: "quantity", old: String(item.quantity), new_: String(quantity) });
    if (unitPrice !== undefined && unitPrice !== item.unitPrice)
      changes.push({ field: "unitPrice", old: String(item.unitPrice), new_: String(unitPrice) });
    if (description !== undefined && description !== item.description)
      changes.push({ field: "description", old: item.description, new_: description });
    if (category !== undefined && category !== item.category)
      changes.push({ field: "category", old: item.category, new_: category });
    if (unit !== undefined && unit !== item.unit)
      changes.push({ field: "unit", old: item.unit, new_: unit });
    if (note !== undefined && note !== (item.note ?? ""))
      changes.push({ field: "note", old: item.note ?? "", new_: note });

    for (const change of changes) {
      await ctx.runMutation(internal.changeLog.record, {
        projectId: item.projectId,
        itemId,
        userId,
        action: change.field === "note" ? "note" : "edit",
        field: change.field,
        oldValue: change.old,
        newValue: change.new_,
        itemDescription: item.description,
      });
    }

    // Recalculate project total
    const allItems = await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", item.projectId))
      .collect();
    const total = allItems.reduce((sum, i) => {
      if (i._id === itemId) return sum + newQty * newPrice;
      return sum + i.totalPrice;
    }, 0);
    await ctx.db.patch(item.projectId, {
      totalCost: Math.round(total * 100) / 100,
    });
  },
});

export const addItem = mutation({
  args: {
    projectId: v.id("projects"),
    category: v.string(),
    description: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    note: v.optional(v.string()),
    confidence: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    const existingItems = await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const totalPrice = Math.round(args.quantity * args.unitPrice * 100) / 100;
    const newItemId = await ctx.db.insert("lineItems", {
      projectId: args.projectId,
      userId,
      position: existingItems.length + 1,
      category: args.category,
      description: args.description,
      unit: args.unit,
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      totalPrice,
      note: args.note,
      confidence: args.confidence ?? "medium",
    });

    // Record to changelog
    await ctx.runMutation(internal.changeLog.record, {
      projectId: args.projectId,
      itemId: newItemId,
      userId,
      action: "add",
      itemDescription: args.description,
      newValue: `${args.quantity} ${args.unit} × ${args.unitPrice} PLN`,
    });

    // Update project total
    const newTotal = existingItems.reduce((s, i) => s + i.totalPrice, 0) + totalPrice;
    await ctx.db.patch(args.projectId, {
      totalCost: Math.round(newTotal * 100) / 100,
    });
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("lineItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Not found");

    // Record deletion
    await ctx.runMutation(internal.changeLog.record, {
      projectId: item.projectId,
      itemId,
      userId,
      action: "delete",
      itemDescription: item.description,
      oldValue: `${item.quantity} ${item.unit} × ${item.unitPrice} PLN = ${item.totalPrice} PLN`,
    });

    await ctx.db.delete(itemId);

    // Recalculate
    const remaining = await ctx.db
      .query("lineItems")
      .withIndex("by_project", (q) => q.eq("projectId", item.projectId))
      .collect();
    const total = remaining.reduce((s, i) => s + i.totalPrice, 0);
    await ctx.db.patch(item.projectId, {
      totalCost: Math.round(total * 100) / 100,
    });
  },
});
