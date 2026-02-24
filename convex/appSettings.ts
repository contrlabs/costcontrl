import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? null;
  },
});

export const internalGet = internalQuery({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? null;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  returns: v.null(),
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("appSettings", { key, value });
    }
    return null;
  },
});
