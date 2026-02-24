/**
 * Seeds test data directly via Convex HTTP client.
 * Run: bun run --bun scripts/seed-test-data.ts
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://proper-penguin-543.convex.cloud";

// We need to auth first — use the test user flow
async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  // Try sign-in, if fails create account first
  console.log("🔑 Signing in as test user...");
  let signInResult: any;
  try {
    signInResult = await client.action(api.auth.signIn, {
      provider: "password",
      params: {
        email: "agent@test.local",
        password: "TestAgent123!",
        flow: "signIn",
      },
    });
  } catch {
    console.log("User doesn't exist, creating...");
    signInResult = await client.action(api.auth.signIn, {
      provider: "password",
      params: {
        email: "agent@test.local",
        password: "TestAgent123!",
        flow: "signUp",
      },
    });
  }

  if (!signInResult || typeof signInResult !== "object") {
    console.log("Sign-in result:", signInResult);
    throw new Error("Failed to sign in");
  }

  const token = (signInResult as any).token;
  if (!token) {
    console.log("Sign-in response:", JSON.stringify(signInResult, null, 2));
    throw new Error("No token in sign-in response");
  }

  client.setAuth(token);
  console.log("✅ Authenticated");

  // Check existing projects
  const projects = await client.query(api.projects.list, {});
  console.log(`Found ${projects.length} existing projects`);

  if (projects.length > 0) {
    console.log("⚠️ Projects already exist, skipping seed");
    return;
  }

  // Create project
  console.log("📦 Creating test project...");
  const projectId = await client.mutation(api.projects.create, {
    name: "Budynek Mieszkalny B2 — Gdańsk",
    fileName: "projekt_B2.pdf",
    currency: "PLN",
  });
  console.log("Project created:", projectId);

  // Add line items
  const items = [
    { category: "OGÓLNOBUDOWLANA", description: "Roboty ziemne — wykopy fundamentowe", unit: "m³", quantity: 450, unitPrice: 35 },
    { category: "OGÓLNOBUDOWLANA", description: "Fundamenty żelbetowe C25/30", unit: "m³", quantity: 120, unitPrice: 1200, note: "Sprawdzić cenę betonu u dostawcy — możliwe rabaty powyżej 100m³" },
    { category: "OGÓLNOBUDOWLANA", description: "Ściany nośne — bloczki silikatowe 24cm", unit: "m²", quantity: 1850, unitPrice: 280 },
    { category: "OGÓLNOBUDOWLANA", description: "Strop prefabrykowany HC320", unit: "m²", quantity: 680, unitPrice: 380 },
    { category: "OGÓLNOBUDOWLANA", description: "Izolacja termiczna — styropian EPS 20cm", unit: "m²", quantity: 1200, unitPrice: 110, note: "Zmiana z 15cm na 20cm — wymóg WT 2024" },
    { category: "OGÓLNOBUDOWLANA", description: "Okna PCV 3-szybowe U=0.7", unit: "m²", quantity: 320, unitPrice: 850 },
    { category: "SANITARNA", description: "Instalacja c.o. — rury PEX + grzejniki", unit: "mb", quantity: 1200, unitPrice: 180 },
    { category: "SANITARNA", description: "Pompa ciepła powietrze-woda 40kW", unit: "szt.", quantity: 1, unitPrice: 85000 },
    { category: "SANITARNA", description: "Ogrzewanie podłogowe", unit: "m²", quantity: 520, unitPrice: 140, note: "Parter + I piętro — rozdzielacze w szachtach technicznych" },
    { category: "ELEKTRYCZNA", description: "Instalacja elektryczna — punkty oświetleniowe", unit: "pkt", quantity: 180, unitPrice: 320 },
    { category: "ELEKTRYCZNA", description: "Instalacja fotowoltaiczna 20kWp", unit: "kpl.", quantity: 1, unitPrice: 78000 },
    { category: "ZEWNĘTRZNA", description: "Kostka brukowa — drogi i chodniki", unit: "m²", quantity: 650, unitPrice: 180 },
    { category: "ZEWNĘTRZNA", description: "Przyłącza (woda+kan+gaz+prąd)", unit: "kpl.", quantity: 1, unitPrice: 24500 },
  ];

  console.log("📝 Adding line items...");
  for (const item of items) {
    await client.mutation(api.lineItems.addItem, { projectId, ...item });
    process.stdout.write(".");
  }
  console.log("\n✅ Items added");

  // Mark completed
  await client.mutation(api.projects.markCompleted, { projectId });
  console.log("✅ Project marked as completed");

  // Make a few edits to populate change log
  const lineItemsList = await client.query(api.lineItems.listByProject, { projectId });
  if (lineItemsList.length > 0) {
    // Edit a price
    await client.mutation(api.lineItems.update, {
      itemId: lineItemsList[0]._id,
      unitPrice: 38,
    });
    console.log("✏️ Edited price on item 1");

    // Edit quantity
    await client.mutation(api.lineItems.update, {
      itemId: lineItemsList[2]._id,
      quantity: 1920,
    });
    console.log("✏️ Edited quantity on item 3");
  }

  console.log("🎉 Seed complete!");
}

main().catch((e) => {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
});
