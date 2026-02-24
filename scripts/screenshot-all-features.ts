import { runTest } from "./auth";

runTest("Screenshot all 4 features", async (helper) => {
  const { page } = helper;

  // 1. Go to dashboard and create a project with test data
  await helper.goto("/dashboard");
  await page.waitForTimeout(2000);

  // Check for existing projects
  const projectLinks = page.locator('a[href*="/estimate/"]');
  const projCount = await projectLinks.count();

  if (projCount === 0) {
    console.log("No projects — creating test project via Convex...");

    // Use Convex mutation directly through the browser console
    await page.evaluate(async () => {
      // Access the convex client through the app
      const { ConvexHttpClient } = await import("convex/browser");
      const client = new ConvexHttpClient(
        (import.meta as any).env.VITE_CONVEX_URL
      );

      // Get auth token from localStorage
      const storageKeys = Object.keys(localStorage);
      let token: string | null = null;
      for (const key of storageKeys) {
        const val = localStorage.getItem(key);
        if (val && val.startsWith("eyJ")) {
          token = val;
          break;
        }
      }

      if (token) {
        client.setAuth(token);
      }

      // Import the api reference
      const { api } = await import("../convex/_generated/api");

      // Create a test project
      const projectId = await client.mutation(api.projects.create as any, {
        name: "Budynek Mieszkalny B2 — Gdańsk",
        fileName: "projekt_B2.pdf",
        currency: "PLN",
      });

      // Add line items
      const items = [
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Roboty ziemne — wykopy fundamentowe",
          unit: "m³",
          quantity: 450,
          unitPrice: 35,
        },
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Fundamenty żelbetowe C25/30",
          unit: "m³",
          quantity: 120,
          unitPrice: 1200,
          note: "Sprawdzić cenę betonu u dostawcy — możliwe rabaty powyżej 100m³",
        },
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Ściany nośne — bloczki silikatowe 24cm",
          unit: "m²",
          quantity: 1850,
          unitPrice: 280,
        },
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Strop prefabrykowany HC320",
          unit: "m²",
          quantity: 680,
          unitPrice: 380,
        },
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Izolacja termiczna — styropian EPS 20cm",
          unit: "m²",
          quantity: 1200,
          unitPrice: 110,
          note: "Zmiana z 15cm na 20cm — wymóg WT 2024",
        },
        {
          category: "OGÓLNOBUDOWLANA",
          description: "Okna PCV 3-szybowe U=0.7",
          unit: "m²",
          quantity: 320,
          unitPrice: 850,
        },
        {
          category: "SANITARNA",
          description: "Instalacja c.o. — rury PEX + grzejniki",
          unit: "mb",
          quantity: 1200,
          unitPrice: 180,
        },
        {
          category: "SANITARNA",
          description: "Pompa ciepła powietrze-woda 40kW",
          unit: "szt.",
          quantity: 1,
          unitPrice: 85000,
        },
        {
          category: "SANITARNA",
          description: "Ogrzewanie podłogowe",
          unit: "m²",
          quantity: 520,
          unitPrice: 140,
          note: "Parter + I piętro — rozdzielacze w szachtach technicznych",
        },
        {
          category: "ELEKTRYCZNA",
          description: "Instalacja elektryczna — punkty oświetleniowe",
          unit: "pkt",
          quantity: 180,
          unitPrice: 320,
        },
        {
          category: "ELEKTRYCZNA",
          description: "Instalacja fotowoltaiczna 20kWp",
          unit: "kpl.",
          quantity: 1,
          unitPrice: 78000,
        },
        {
          category: "ZEWNĘTRZNA",
          description: "Kostka brukowa — drogi i chodniki",
          unit: "m²",
          quantity: 650,
          unitPrice: 180,
        },
        {
          category: "ZEWNĘTRZNA",
          description: "Przyłącza (woda+kan+gaz+prąd)",
          unit: "kpl.",
          quantity: 1,
          unitPrice: 24500,
        },
      ];

      for (const item of items) {
        await client.mutation(api.lineItems.addItem as any, {
          projectId,
          ...item,
        });
      }

      // Mark project as completed
      await client.mutation(api.projects.markCompleted as any, {
        projectId,
      });

      return projectId;
    });

    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForTimeout(2000);
  }

  // Navigate to first project
  const links = page.locator('a[href*="/estimate/"]');
  const linkCount = await links.count();
  console.log(`Found ${linkCount} project(s)`);

  if (linkCount > 0) {
    await links.first().click();
    await page.waitForTimeout(3000);

    // === SCREENSHOT 1: Full estimate page with categories ===
    await page.screenshot({
      path: "/tmp/ss-1-estimate.png",
      fullPage: false,
    });
    console.log("📸 1. Estimate page");

    // === SCREENSHOT 2: Inline editing ===
    const editableCells = page.locator("table td span.cursor-pointer");
    const editCount = await editableCells.count();
    console.log(`Found ${editCount} editable cells`);
    if (editCount > 0) {
      await editableCells.nth(1).click(); // click a description
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/tmp/ss-2-inline-edit.png",
        fullPage: false,
      });
      console.log("📸 2. Inline editing");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    // === SCREENSHOT 3: Note visible ===
    // Notes should be visible inline already
    const noteIcons = page.locator("text=Sprawdzić cenę");
    if ((await noteIcons.count()) > 0) {
      await page.screenshot({
        path: "/tmp/ss-3-notes.png",
        fullPage: false,
      });
      console.log("📸 3. Notes visible");
    }

    // === SCREENSHOT 4: History panel ===
    const histBtn = page.locator("button").filter({ hasText: /Historia|History/ });
    if ((await histBtn.count()) > 0) {
      await histBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: "/tmp/ss-4-history.png",
        fullPage: false,
      });
      console.log("📸 4. History panel");

      // Close
      const overlay = page.locator(".fixed.inset-0.bg-black\\/20");
      if ((await overlay.count()) > 0) {
        await overlay.click({ position: { x: 100, y: 300 } });
        await page.waitForTimeout(500);
      }
    }

    // === SCREENSHOT 5: Templates panel ===
    const tmplBtn = page.locator("button").filter({ hasText: /Cennik|Templates/ });
    if ((await tmplBtn.count()) > 0) {
      await tmplBtn.first().click();
      await page.waitForTimeout(1000);

      // Seed templates if empty
      const seedBtn = page.locator("button").filter({ hasText: /Załaduj cennik|Load reference/ });
      if ((await seedBtn.count()) > 0) {
        await seedBtn.click();
        await page.waitForTimeout(3000);
      }

      await page.screenshot({
        path: "/tmp/ss-5-templates.png",
        fullPage: false,
      });
      console.log("📸 5. Templates panel");
    }

    console.log("✅ All screenshots done");
  } else {
    console.log("❌ Still no projects after creation attempt");
    await page.screenshot({ path: "/tmp/ss-debug.png", fullPage: true });
  }
}).catch(() => process.exit(1));
