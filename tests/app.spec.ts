import { expect, test } from "@playwright/test";

test("formats what is typed and copies it", async ({ page, context, browserName }) => {
  await page.goto("./");
  const editor = page.getByRole("textbox", { name: "Post" });
  const post = page.locator("#post");

  // The sample post converts once Pyodide and the wheels have loaded.
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘 𝗟𝗘𝗦𝗦𝗢𝗡𝗦", { timeout: 60_000 });

  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await expect(post).toHaveText("");
  await expect(page.getByRole("button", { name: "Copy text" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type("Hello");
  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type(" world ");
  await page.getByRole("button", { name: "Inline code" }).click();
  await page.keyboard.type("x");
  await expect(post).toHaveText("𝗛𝗲𝗹𝗹𝗼 world 𝚡");
  await expect(page.locator("#count")).toHaveText("19 / 3,000");

  await page.getByLabel("Monospace code").uncheck();
  await expect(post).toHaveText("𝗛𝗲𝗹𝗹𝗼 world x");

  // Only Chromium lets a test read the clipboard back.
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy text" }).click();
    await expect(page.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("𝗛𝗲𝗹𝗹𝗼 world x\n");
  }

  // The draft survives a reload.
  await page.reload();
  await expect(post).toHaveText("𝗛𝗲𝗹𝗹𝗼 world x", { timeout: 60_000 });
});

test("overrides the system colour scheme and returns to it", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await background();

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  expect(await background()).not.toBe(light);

  // The override survives a reload, and switching back to the system's
  // scheme clears it rather than pinning light.
  await page.reload();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  expect(await background()).toBe(light);
  expect(
    await page.evaluate(() => localStorage.getItem("linkedin-post-formatter:color-scheme")),
  ).toBeNull();
});
