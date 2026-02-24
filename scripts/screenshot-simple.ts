import { runTest } from "./auth";

runTest("Screenshot features", async (helper) => {
  const { page } = helper;
  
  // Go to dashboard
  await helper.goto("/dashboard");
  await page.waitForTimeout(2000);

  // Check projects
  const projectLinks = page.locator('a[href*="/estimate/"]');
  let projCount = await projectLinks.count();
  console.log(`Projects: ${projCount}`);

  if (projCount === 0) {
    console.log("Creating test project via UI mutations...");
    
    // Use page.evaluate to call Convex mutations through the existing client
    const projectId = await page.evaluate(async () => {
      // Access the Convex client that's already set up in the React app
      // We'll use fetch to the Convex HTTP API since the client is authenticated
      const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || "https://proper-penguin-543.convex.cloud";
      
      // Get the authenticated convex client from window
      // The ConvexReactClient is available through the app
      return new Promise<string>((resolve) => {
        // Wait a bit for React to be ready
        setTimeout(() => {
          // The app should have window.__CONVEX_CLIENT or similar
          // Let's try a different approach - use the mutation endpoint
          resolve("need-ui");
        }, 100);
      });
    });

    if (projectId === "need-ui") {
      // Create via UI: click "Nowy kosztorys"
      const newBtn = page.locator('button:has-text("Nowy kosztorys"), a:has-text("Nowy kosztorys")');
      if (await newBtn.count() > 0) {
        await newBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Fill project name
        const nameInput = page.locator('input[placeholder*="np."], input[placeholder*="e.g."]');
        if (await nameInput.count() > 0) {
          await nameInput.fill("Budynek B2 — Gdańsk");
        }
        
        // We need a file... let's create a dummy text file
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          // Create a buffer for a simple text file
          const buffer = Buffer.from(
            "PROJEKT BUDOWLANY - Budynek Mieszkalny B2\n" +
            "Powierzchnia: 2400 m²\n" +
            "Kondygnacje: 4 nadziemne + garaż podziemny\n" +
            "Konstrukcja: żelbetowa monolityczna\n" +
            "Ściany: bloczki silikatowe 24cm\n" +
            "Dach: stropodach z papą\n" +
            "Elewacja: tynk silikonowy + styropian 20cm"
          );
          
          const tmpFile = "/tmp/test-projekt.txt";
          const fs = await import("fs");
          fs.writeFileSync(tmpFile, buffer);
          
          await fileInput.setInputFiles(tmpFile);
          await page.waitForTimeout(500);
          
          // Click analyze button
          const analyzeBtn = page.locator('button:has-text("Analizuj")');
          if (await analyzeBtn.count() > 0) {
            await analyzeBtn.click();
            console.log("⏳ Analyzing... waiting up to 120s");
            await page.waitForTimeout(120000); // wait for AI analysis
          }
        }
      }
    }
    
    // Refresh and check again
    await helper.goto("/dashboard");
    await page.waitForTimeout(3000);
    projCount = await projectLinks.count();
    console.log(`Projects after creation: ${projCount}`);
  }

  if (projCount > 0) {
    await projectLinks.first().click();
    await page.waitForTimeout(3000);

    // Screenshot 1: Main estimate page
    await page.screenshot({ path: "/tmp/ss-1-estimate.png", fullPage: false });
    console.log("📸 1. Estimate page");

    // Scroll down to show categories
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/ss-2-categories.png", fullPage: false });
    console.log("📸 2. Categories");

    // Try inline edit
    const clickable = page.locator("span.cursor-pointer").first();
    if (await clickable.count() > 0) {
      await clickable.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/ss-3-inline-edit.png", fullPage: false });
      await page.keyboard.press("Escape");
      console.log("📸 3. Inline edit");
    }

    // History panel
    const histBtn = page.locator("button").filter({ hasText: /Historia|History/ });
    if (await histBtn.count() > 0) {
      await histBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/ss-4-history.png", fullPage: false });
      // Close overlay
      const overlay = page.locator("div.fixed.inset-0").first();
      if (await overlay.count() > 0) {
        await overlay.click({ position: { x: 200, y: 400 }, force: true });
      }
      await page.waitForTimeout(500);
      console.log("📸 4. History");
    }

    // Templates panel
    const tmplBtn = page.locator("button").filter({ hasText: /Cennik|Templates/ });
    if (await tmplBtn.count() > 0) {
      await tmplBtn.first().click();
      await page.waitForTimeout(1000);

      // Seed if needed
      const seedBtn = page.locator("button").filter({ hasText: /Załaduj|Load/ });
      if (await seedBtn.count() > 0) {
        await seedBtn.click();
        await page.waitForTimeout(3000);
      }

      await page.screenshot({ path: "/tmp/ss-5-templates.png", fullPage: false });
      console.log("📸 5. Templates");
    }

    console.log("✅ All screenshots done!");
  } else {
    await page.screenshot({ path: "/tmp/ss-dashboard-empty.png", fullPage: false });
    console.log("⚠️ No projects available");
  }
}).catch(() => process.exit(1));
