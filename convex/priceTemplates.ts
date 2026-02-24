import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all templates: global + user's own
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const globalTemplates = await ctx.db
      .query("priceTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true))
      .collect();

    if (!userId) return globalTemplates;

    const userTemplates = await ctx.db
      .query("priceTemplates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return [...globalTemplates, ...userTemplates];
  },
});

// Search templates by description (prefix match)
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const userId = await getAuthUserId(ctx);
    const lower = q.toLowerCase();

    const globalTemplates = await ctx.db
      .query("priceTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true))
      .collect();

    const userTemplates = userId
      ? await ctx.db
          .query("priceTemplates")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect()
      : [];

    const all = [...globalTemplates, ...userTemplates];
    return all
      .filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          t.category.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});

// List by category
export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("priceTemplates")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
  },
});

// Get all unique categories
export const categories = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("priceTemplates").collect();
    const cats = new Set(all.map((t) => t.category));
    return [...cats].sort();
  },
});

// Add user template
export const addUserTemplate = mutation({
  args: {
    category: v.string(),
    description: v.string(),
    unit: v.string(),
    unitPrice: v.number(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.insert("priceTemplates", {
      userId,
      isGlobal: false,
      category: args.category,
      description: args.description,
      unit: args.unit,
      unitPrice: args.unitPrice,
      source: args.source ?? "user",
    });
  },
});

// Remove user template
export const removeTemplate = mutation({
  args: { templateId: v.id("priceTemplates") },
  handler: async (ctx, { templateId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const tmpl = await ctx.db.get(templateId);
    if (!tmpl) return;
    // Only allow removing own templates
    if (!tmpl.isGlobal && tmpl.userId === userId) {
      await ctx.db.delete(templateId);
    }
  },
});

// Seed global templates (Polish construction prices)
export const seedGlobalTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    // Check if already seeded
    const existing = await ctx.db
      .query("priceTemplates")
      .withIndex("by_global", (q) => q.eq("isGlobal", true))
      .first();
    if (existing) return; // already seeded

    const templates = [
      // OGÓLNOBUDOWLANA
      { category: "OGÓLNOBUDOWLANA", description: "Roboty ziemne — wykopy", unit: "m³", unitPrice: 35, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Fundamenty żelbetowe", unit: "m³", unitPrice: 1200, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Ściany nośne murowane (bloczki)", unit: "m²", unitPrice: 280, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Ściany działowe (g-k podwójne)", unit: "m²", unitPrice: 140, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Strop żelbetowy monolityczny", unit: "m²", unitPrice: 450, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Strop prefabrykowany (płyty HC)", unit: "m²", unitPrice: 380, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Schody żelbetowe", unit: "m²", unitPrice: 900, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Izolacja termiczna — styropian EPS 15cm", unit: "m²", unitPrice: 95, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Izolacja termiczna — wełna mineralna 20cm", unit: "m²", unitPrice: 120, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Tynk cementowo-wapienny wewnętrzny", unit: "m²", unitPrice: 55, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Tynk silikonowy elewacyjny", unit: "m²", unitPrice: 85, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Wylewka cementowa 5cm", unit: "m²", unitPrice: 45, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Posadzka — gres 60x60", unit: "m²", unitPrice: 160, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Posadzka — panele podłogowe", unit: "m²", unitPrice: 110, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Malowanie ścian (2x emulsja)", unit: "m²", unitPrice: 28, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Okna PCV 3-szybowe", unit: "m²", unitPrice: 850, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Drzwi wewnętrzne z ościeżnicą", unit: "szt.", unitPrice: 1200, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Drzwi zewnętrzne aluminiowe", unit: "szt.", unitPrice: 4500, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Dach — więźba drewniana", unit: "m²", unitPrice: 280, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Dach — pokrycie blachodachówką", unit: "m²", unitPrice: 180, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Dach — papa termozgrzewalna (stropodach)", unit: "m²", unitPrice: 120, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Konstrukcja stalowa — słupy/belki", unit: "t", unitPrice: 14000, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Beton C25/30 z pompą", unit: "m³", unitPrice: 480, source: "ref-2024" },
      { category: "OGÓLNOBUDOWLANA", description: "Zbrojenie — stal B500SP", unit: "t", unitPrice: 5500, source: "ref-2024" },

      // SANITARNA
      { category: "SANITARNA", description: "Instalacja wod-kan — rurociągi PP", unit: "mb", unitPrice: 120, source: "ref-2024" },
      { category: "SANITARNA", description: "Instalacja c.o. — rury PEX + grzejniki", unit: "mb", unitPrice: 180, source: "ref-2024" },
      { category: "SANITARNA", description: "Grzejnik płytowy C22 (900x600)", unit: "szt.", unitPrice: 650, source: "ref-2024" },
      { category: "SANITARNA", description: "Kocioł gazowy kondensacyjny 24kW", unit: "szt.", unitPrice: 8500, source: "ref-2024" },
      { category: "SANITARNA", description: "Pompa ciepła powietrze-woda 12kW", unit: "szt.", unitPrice: 38000, source: "ref-2024" },
      { category: "SANITARNA", description: "Wentylacja mechaniczna z rekuperacją", unit: "szt.", unitPrice: 18000, source: "ref-2024" },
      { category: "SANITARNA", description: "Kanalizacja sanitarna PVC Ø160", unit: "mb", unitPrice: 95, source: "ref-2024" },
      { category: "SANITARNA", description: "Kanalizacja deszczowa PVC Ø200", unit: "mb", unitPrice: 110, source: "ref-2024" },
      { category: "SANITARNA", description: "Komplet łazienkowy (WC + umywalka + wanna)", unit: "kpl.", unitPrice: 6500, source: "ref-2024" },
      { category: "SANITARNA", description: "Ogrzewanie podłogowe", unit: "m²", unitPrice: 140, source: "ref-2024" },

      // ELEKTRYCZNA
      { category: "ELEKTRYCZNA", description: "Instalacja elektryczna — punkt oświetl.", unit: "pkt", unitPrice: 320, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Instalacja elektryczna — punkt gniazdkowy", unit: "pkt", unitPrice: 280, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Rozdzielnia główna RG", unit: "szt.", unitPrice: 3500, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Instalacja odgromowa", unit: "mb", unitPrice: 85, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Instalacja fotowoltaiczna 10kWp", unit: "kpl.", unitPrice: 42000, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Instalacja teletechniczna (LAN, TV)", unit: "pkt", unitPrice: 250, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "System alarmowy + monitoring CCTV", unit: "kpl.", unitPrice: 8000, source: "ref-2024" },
      { category: "ELEKTRYCZNA", description: "Oświetlenie LED — oprawa natynkowa", unit: "szt.", unitPrice: 180, source: "ref-2024" },

      // ZEWNĘTRZNA
      { category: "ZEWNĘTRZNA", description: "Kostka brukowa — chodniki", unit: "m²", unitPrice: 160, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Kostka brukowa — droga dojazdowa", unit: "m²", unitPrice: 200, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Ogrodzenie — panele ogrodzeniowe", unit: "mb", unitPrice: 350, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Brama wjazdowa przesuwna", unit: "szt.", unitPrice: 8000, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Zieleń — trawnik z rolki", unit: "m²", unitPrice: 35, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Przyłącze wodociągowe", unit: "kpl.", unitPrice: 6500, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Przyłącze kanalizacyjne", unit: "kpl.", unitPrice: 8000, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Przyłącze gazowe", unit: "kpl.", unitPrice: 4500, source: "ref-2024" },
      { category: "ZEWNĘTRZNA", description: "Przyłącze elektroenergetyczne", unit: "kpl.", unitPrice: 5500, source: "ref-2024" },
    ];

    for (const tmpl of templates) {
      await ctx.db.insert("priceTemplates", {
        isGlobal: true,
        category: tmpl.category,
        description: tmpl.description,
        unit: tmpl.unit,
        unitPrice: tmpl.unitPrice,
        source: tmpl.source,
      });
    }
  },
});
