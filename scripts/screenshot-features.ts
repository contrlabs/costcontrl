import { runTest } from "./auth";

runTest("Screenshot new features", async (helper) => {
  const { page } = helper;

  // Go to dashboard
  await helper.goto("/dashboard");
  await page.waitForTimeout(2000);

  // Check if there are any projects
  const projectCards = page.locator('a[href*="/estimate/"]');
  const count = await projectCards.count();

  if (count > 0) {
    // Click first project
    await projectCards.first().click();
    await page.waitForTimeout(3000);

    // Screenshot the full estimate page
    await page.screenshot({ path: "/tmp/ss-estimate-full.png", fullPage: false });

    // Try to click on a description cell to show inline editing
    const descCells = page.locator("table td span.cursor-pointer");
    if (await descCells.count() > 0) {
      await descCells.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/ss-inline-edit.png", fullPage: false });
      await page.keyboard.press("Escape");
    }

    // Click History button
    const historyBtn = page.locator('button:has-text("Historia zmian"), button:has-text("Change History")');
    if (await historyBtn.count() > 0) {
      await historyBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/ss-history.png", fullPage: false });
      // Close
      await page.locator('.fixed.inset-0').click({ position: { x: 100, y: 300 } });
      await page.waitForTimeout(500);
    }

    // Click Templates button
    const templatesBtn = page.locator('button:has-text("Cennik"), button:has-text("Price Templates")');
    if (await templatesBtn.count() > 0) {
      await templatesBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/ss-templates.png", fullPage: false });
    }

    console.log("✅ Screenshots taken");
  } else {
    // Screenshot dashboard
    await page.screenshot({ path: "/tmp/ss-dashboard.png", fullPage: false });
    console.log("⚠️ No projects found, took dashboard screenshot");
  }
}).catch(() => process.exit(1));
