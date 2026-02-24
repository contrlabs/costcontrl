import { runTest } from "./auth";

runTest("Screenshot templates", async (helper) => {
  const { page } = helper;

  // Go to dashboard
  await helper.goto("/dashboard");
  await page.waitForTimeout(2000);

  // Navigate to first project
  const links = page.locator('a[href*="/estimate/"]');
  if (await links.count() === 0) {
    console.log("❌ No projects");
    return;
  }

  await links.first().click();
  await page.waitForTimeout(3000);

  // Click templates button
  const tmplBtn = page.locator("button").filter({ hasText: /Cennik|Templates/ });
  console.log(`Template buttons: ${await tmplBtn.count()}`);
  
  if (await tmplBtn.count() > 0) {
    await tmplBtn.first().click();
    await page.waitForTimeout(1500);

    // Check if we need to seed
    const seedBtn = page.locator("button").filter({ hasText: /Załaduj|Load/ });
    const seedCount = await seedBtn.count();
    console.log(`Seed buttons: ${seedCount}`);
    
    if (seedCount > 0) {
      await seedBtn.first().click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: "/tmp/ss-5-templates.png", fullPage: false });
    console.log("📸 Templates panel!");
  }

  console.log("✅ Done");
}).catch(() => process.exit(1));
