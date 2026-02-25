import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    fileName: v.string(),
    fileId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("error")
    ),
    totalCost: v.optional(v.number()),
    currency: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    fileCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  projectFiles: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    fileName: v.string(),
    fileId: v.id("_storage"),
    fileType: v.optional(v.string()),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("analyzed"),
      v.literal("error")
    ),
    extractedText: v.optional(v.string()),
    analysisResult: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  appSettings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  lineItems: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    position: v.number(),
    category: v.string(),
    description: v.string(),
    unit: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    sourceFile: v.optional(v.string()),
    note: v.optional(v.string()),
    confidence: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  }).index("by_project", ["projectId"]),

  // --- Change log for versioning ---
  changeLog: defineTable({
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
    timestamp: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_item", ["itemId"]),

  // --- Price templates ---
  priceTemplates: defineTable({
    userId: v.optional(v.string()),
    isGlobal: v.boolean(),
    category: v.string(),
    description: v.string(),
    unit: v.string(),
    unitPrice: v.number(),
    source: v.optional(v.string()),
  })
    .index("by_global", ["isGlobal"])
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),
});

export default schema;
