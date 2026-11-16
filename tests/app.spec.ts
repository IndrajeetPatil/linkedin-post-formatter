import { expect, test } from "@playwright/test";

test("formats what is typed and copies it", async ({ page, context, browserName }) => {
  await page.goto("./");
  const editor = page.getByRole("textbox", { name: "Post" });
  const post = page.locator("#post");

  // The sample post converts once Pyodide and the wheels have loaded.
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘 𝗟𝗘𝗦𝗦𝗢𝗡𝗦", { timeout: 60_000 });

  // `fill` clears the editor the same way on every platform; select-all
  // shortcuts differ between desktop and mobile browsers.
  await editor.fill("");
  // Some browsers keep the sample's heading block after clearing; start from
  // a plain paragraph.
  const heading = page.getByRole("button", { name: "Heading", exact: true });
  if ((await heading.getAttribute("aria-pressed")) === "true") {
    await heading.click();
  }
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

test("fits the narrowest phones without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("./");
  await expect(page.locator("#post")).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("keeps working when storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
    Storage.prototype.removeItem = blocked;
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });

  // Edits still convert. Clearing can leave the sample's heading block
  // behind in some browsers, so either rendering of the new text counts.
  await page.getByRole("textbox", { name: "Post" }).fill("Still here");
  await expect(post).toContainText(/Still here|𝗦𝗧𝗜𝗟𝗟 𝗛𝗘𝗥𝗘/u);

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("copies the latest edit while it is still converting", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Only Chromium lets a test read the clipboard back.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Hold requests to the worker back, and so its replies, for as long as
  // `replyDelay` says.
  await page.addInitScript(() => {
    // oxlint-disable-next-line typescript/unbound-method -- called with `this` below.
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (this: Worker, message: unknown) {
      const delay = (globalThis as { replyDelay?: number }).replyDelay ?? 0;
      setTimeout(() => {
        send.call(this, message);
      }, delay);
    };
  });
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });

  await page.evaluate(() => {
    (globalThis as { replyDelay?: number }).replyDelay = 1500;
  });
  await page.getByRole("textbox", { name: "Post" }).fill("Fresh text");
  await page.getByRole("button", { name: "Copy text" }).click();
  // The preview still shows the old post when the click lands.
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘");
  await expect(page.getByRole("status")).toHaveText("Copied", { timeout: 10_000 });
  const copied = await page.evaluate(async () => navigator.clipboard.readText());
  expect(copied).toMatch(/Fresh text|𝗙𝗥𝗘𝗦𝗛 𝗧𝗘𝗫𝗧/u);
});

test("clears the post, and the empty draft persists", async ({ page }) => {
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });

  const clear = page.getByRole("button", { name: "Clear post" });
  await clear.click();
  await expect(post).toHaveText("");
  await expect(clear).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: "Heading", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  // The cleared draft is what a reload brings back.
  await page.reload();
  await expect(page.locator("#count")).toHaveText("0 / 3,000", { timeout: 60_000 });
  await expect(post).toHaveText("");
});
