import { runTest } from "./auth";

runTest("Screenshot features v2", async (helper) => {
  const { page } = helper;

  // Go to dashboard
  await helper.goto("/dashboard");
  await page.waitForTimeout(2000);

  // Seed data via page's authenticated Convex connection
  const projCount = await page.locator('a[href*="/estimate/"]').count();
  console.log(`Existing projects: ${projCount}`);

  if (projCount === 0) {
    console.log("Seeding test data via authenticated page context...");

    // Use window.__convexClient which is set by ConvexProvider
    await page.evaluate(async () => {
      // Access React fiber to get Convex client
      const root = document.getElementById("root");
      if (!root) throw new Error("No root element");

      // Try to find ConvexReactClient in the component tree
      // Alternative: use fetch directly against the Convex HTTP endpoint
      const convexUrl = document.querySelector("meta[name='convex-url']")?.getAttribute("content")
        || "https://proper-penguin-543.convex.cloud";

      // Get the auth token from the Convex client in localStorage
      let token = "";
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        const val = localStorage.getItem(key) || "";
        if (val.length > 100 && val.includes(".")) {
          token = val;
          break;
        }
      }

      if (!token) {
        console.error("No auth token found in localStorage");
        return;
      }

      // Create project via Convex HTTP API
      const callMutation = async (name: string, args: Record<string, unknown>) => {
        const resp = await fetch(`${convexUrl}/api/mutation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            path: name,
            args: args,
            format: "json",
          }),
        });
        const data = await resp.json();
        if (data.status === "error") throw new Error(data.errorMessage);
        return data.value;
      };

      // Create project
      const projectId = await callMutation("projects:create", {
        name: "Budynek Mieszkalny B2 — Gdańsk",
        fileName: "projekt_B2.pdf",
        currency: "PLN",
      });
      console.log("Created project:", projectId);

      // Add items
      const items = [
        { category: "OGÓLNOBUDOWLANA", description: "Roboty ziemne — wykopy fundamentowe", unit: "m³", quantity: 450, unitPrice: 35 },
        { category: "OGÓLNOBUDOWLANA", description: "Fundamenty żelbetowe C25/30", unit: "m³", quantity: 120, unitPrice: 1200, note: "Sprawdzić cenę betonu u dostawcy — możliwe rabaty powyżej 100m³" },
        { category: "OGÓLNOBUDOWLANA", description: "Ściany nośne — bloczki silikatowe 24cm", unit: "m²", quantity: 1850, unitPrice: 280 },
        { category: "OGÓLNOBUDOWLANA", description: "Strop prefabrykowany HC320", unit: "m²", quantity: 680, unitPrice: 380 },
        { category: "OGÓLNOBUDOWLANA", description: "Izolacja termiczna — styropian EPS 20cm", unit: "m²", quantity: 1200, unitPrice: 110, note: "Zmiana z 15cm na 20cm — wymóg WT 2024" },
        { category: "OGÓLNOBUDOWLANA", description: "Okna PCV 3-szybowe U=0.7", unit: "m²", quantity: 320, unitPrice: 850 },
        { category: "SANITARNA", description: "Instalacja c.o. — rury PEX + grzejniki", unit: "mb", quantity: 1200, unitPrice: 180 },
        { category: "SANITARNA", description: "Pompa ciepła powietrze-woda 40kW", unit: "szt.", quantity: 1, unitPrice: 85000 },
        { category: "SANITARNA", description: "Ogrzewanie podłogowe", unit: "m²", quantity: 520, unitPrice: 140, note: "Parter + I piętro — rozdzielacze w szachtach" },
        { category: "ELEKTRYCZNA", description: "Punkty oświetleniowe LED", unit: "pkt", quantity: 180, unitPrice: 320 },
        { category: "ELEKTRYCZNA", description: "Instalacja fotowoltaiczna 20kWp", unit: "kpl.", quantity: 1, unitPrice: 78000 },
        { category: "ZEWNĘTRZNA", description: "Kostka brukowa — drogi i chodniki", unit: "m²", quantity: 650, unitPrice: 180 },
        { category: "ZEWNĘTRZNA", description: "Przyłącza (woda+kan+gaz+prąd)", unit: "kpl.", quantity: 1, unitPrice: 24500 },
      ];

      for (const item of items) {
        await callMutation("lineItems:addItem", { projectId, ...item });
      }

      // Mark completed
      await callMutation("projects:markCompleted", { projectId });

      // Make some edits to populate changelog
      const resp = await fetch(`${convexUrl}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: "lineItems:listByProject",
          args: { projectId },
          format: "json",
        }),
      });
      const queryData = await resp.json();
      const lineItems = queryData.value || [];

      if (lineItems.length > 0) {
        await callMutation("lineItems:update", { itemId: lineItems[0]._id, unitPrice: 38 });
        await callMutation("lineItems:update", { itemId: lineItems[2]._id, quantity: 1920 });
      }

      console.log("✅ Seeded all test data");
    });

    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(3000);
  }

  // Now navigate to estimate
  const links = page.locator('a[href*="/estimate/"]');
  const linkCount = await links.count();
  console.log(`Projects now: ${linkCount}`);

  if (linkCount === 0) {
    console.log("❌ No projects after seeding");
    await page.screenshot({ path: "/tmp/ss-debug.png", fullPage: true });
    return;
  }

  await links.first().click();
  await page.waitForTimeout(3000);

  // 📸 1. Full estimate page
  await page.screenshot({ path: "/tmp/ss-1-estimate.png", fullPage: false });
  console.log("📸 1. Estimate page with collapsible categories");

  // Scroll to show more
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/ss-2-scroll.png", fullPage: false });
  console.log("📸 2. Scrolled view with notes");

  // 📸 3. Click a cell to show inline editing
  const editableCells = page.locator("span.cursor-pointer");
  const editCount = await editableCells.count();
  console.log(`Editable cells: ${editCount}`);
  if (editCount > 2) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await editableCells.nth(1).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/ss-3-inline.png", fullPage: false });
    console.log("📸 3. Inline editing active");
    await page.keyboard.press("Escape");
  }

  // 📸 4. History panel
  await page.evaluate(() => window.scrollTo(0, 0));
  const histBtn = page.locator("button").filter({ hasText: /Historia|History/ });
  if (await histBtn.count() > 0) {
    await histBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "/tmp/ss-4-history.png", fullPage: false });
    console.log("📸 4. History panel");
    // Close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  // 📸 5. Templates panel
  const tmplBtn = page.locator("button").filter({ hasText: /Cennik|Templates/ });
  if (await tmplBtn.count() > 0) {
    await tmplBtn.first().click();
    await page.waitForTimeout(1000);

    // Seed templates
    const seedBtn = page.locator("button").filter({ hasText: /Załaduj|Load/ });
    if (await seedBtn.count() > 0) {
      await seedBtn.click();
      await page.waitForTimeout(4000);
    }

    await page.screenshot({ path: "/tmp/ss-5-templates.png", fullPage: false });
    console.log("📸 5. Price templates panel");
  }

  console.log("🎉 All screenshots captured!");
}).catch(() => process.exit(1));
