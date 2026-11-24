import { expect, test } from "@playwright/test";

test("formats what is typed and copies it", async ({
  page,
  context,
  browserName,
}) => {
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
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "𝗛𝗲𝗹𝗹𝗼 world x\n",
    );
  }

  // The draft survives a reload.
  await page.reload();
  await expect(post).toHaveText("𝗛𝗲𝗹𝗹𝗼 world x", { timeout: 60_000 });
});

test("overrides the system colour scheme and returns to it", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const background = () =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await background();

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  expect(await background()).not.toBe(light);

  // The override survives a reload, and switching back to the system's
  // scheme clears it rather than pinning light.
  await page.reload();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  expect(await background()).toBe(light);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("linkedin-post-formatter:color-scheme"),
    ),
  ).toBeNull();
});

test("fits the narrowest phones without sideways scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("./");
  await expect(page.locator("#post")).toContainText("𝗧𝗛𝗥𝗘𝗘", {
    timeout: 60_000,
  });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("stops at the page edges instead of bouncing past them", async ({
  page,
}) => {
  await page.goto("./");
  const overscroll = await page.evaluate(() =>
    [document.documentElement, document.body].map((element) => {
      const style = getComputedStyle(element);
      return [style.overscrollBehaviorX, style.overscrollBehaviorY];
    }),
  );
  expect(overscroll).toEqual([
    ["none", "none"],
    ["none", "none"],
  ]);
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
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
});

test("copies the latest edit while it is still converting", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Only Chromium lets a test read the clipboard back.",
  );
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
  await expect(page.getByRole("status")).toHaveText("Copied", {
    timeout: 10_000,
  });
  const copied = await page.evaluate(async () =>
    navigator.clipboard.readText(),
  );
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
  await expect(
    page.getByRole("button", { name: "Clear formatting" }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("button", { name: "Heading", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");

  // The cleared draft is what a reload brings back.
  await page.reload();
  await expect(page.locator("#count")).toHaveText("0 / 3,000", {
    timeout: 60_000,
  });
  await expect(post).toHaveText("");
});

test("nests the post's headings under the page's own", async ({ page }) => {
  await page.goto("./");
  // The sample post's level-1 heading sits below "Write", which leaves the
  // page one h1, and still converts as a level-1 heading.
  await expect(
    page.getByRole("heading", {
      name: "Three lessons from a weekend project",
      level: 3,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("#post")).toContainText("𝗧𝗛𝗥𝗘𝗘 𝗟𝗘𝗦𝗦𝗢𝗡𝗦", {
    timeout: 60_000,
  });
});

test("describes itself to search engines and link previews", async ({
  page,
  request,
}) => {
  await page.goto("./");
  const site = "https://www.indrapatil.com/linkedin-post-formatter/";
  await expect(page).toHaveTitle("LinkedIn Post Formatter and Text Editor");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    site,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${site}social-card.png`,
  );
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "",
  ) as unknown;
  expect(data).toMatchObject({ "@type": "WebApplication", url: site });

  // The card and the sitemap ship with the build.
  const card = await request.get("social-card.png");
  expect(card.ok()).toBe(true);
  expect(card.headers()["content-type"]).toBe("image/png");
  expect((await request.get("sitemap.xml")).ok()).toBe(true);
});

test("keeps emoji pasted as images", async ({ page }) => {
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });
  await page.getByRole("button", { name: "Clear post" }).click();
  await expect(post).toHaveText("");

  // Sites that draw emoji as images copy them as <img alt="…">; an image
  // without an emoji in its alt is still dropped.
  await page.getByRole("textbox", { name: "Post" }).evaluate((editor) => {
    const data = new DataTransfer();
    data.setData(
      "text/html",
      '<p>Shipped <img alt="🚀" src="data:,"> <img alt="👍🏽" src="data:,"><img alt="logo" src="data:,"></p>',
    );
    data.setData("text/plain", "Shipped 🚀 👍🏽");
    // Firefox ignores `clipboardData` in the constructor, so set it on the event.
    const paste = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, "clipboardData", { value: data });
    editor.dispatchEvent(paste);
  });
  await expect(post).toHaveText("Shipped 🚀 👍🏽");
});

test("fits a laptop window, scrolling a long post inside its panel", async ({
  page,
}) => {
  test.skip(
    test.info().project.name.match(/iphone|android/) !== null,
    "Phones stack the panels.",
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("./");
  await expect(page.locator("#post")).toContainText("𝗧𝗛𝗥𝗘𝗘", {
    timeout: 60_000,
  });
  const overflow = () =>
    page.evaluate(
      () =>
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight,
    );
  expect(await overflow()).toBe(0);

  await page.getByRole("textbox", { name: "Post" }).fill("Line\n".repeat(80));
  await expect(page.locator("#post")).toContainText("Line");
  expect(await overflow()).toBe(0);
  await expect(
    page.getByRole("button", { name: "Copy text" }),
  ).toBeInViewport();
});

test("starts the editor and the post on the same line", async ({ page }) => {
  test.skip(
    test.info().project.name.match(/iphone|android/) !== null,
    "Phones stack the panels.",
  );
  for (const width of [900, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("./");
    await expect(page.locator("#post")).toContainText("𝗧𝗛𝗥𝗘𝗘", {
      timeout: 60_000,
    });
    const editor = await page
      .getByRole("textbox", { name: "Post" })
      .boundingBox();
    const post = await page.locator("#post").boundingBox();
    expect(post?.y).toBe(editor?.y);
  }
});

test("styles overlapping bold and italic, and keeps them on reload", async ({
  page,
}) => {
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });
  await page.getByRole("button", { name: "Clear post" }).click();
  await expect(post).toHaveText("");

  // As Markdown, these would need delimiters that flank punctuation and
  // spaces, which parse as literal asterisks.
  await page.getByRole("textbox", { name: "Post" }).evaluate((editor) => {
    const data = new DataTransfer();
    data.setData(
      "text/html",
      "<ul><li><p><strong>zero </strong><em><strong>data</strong> retention</em><strong>:</strong> <em>no</em>, ok</p></li></ul>",
    );
    data.setData("text/plain", "zero data retention: no, ok");
    const paste = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, "clipboardData", { value: data });
    editor.dispatchEvent(paste);
  });
  const styled = "• 𝘇𝗲𝗿𝗼 𝙙𝙖𝙩𝙖 𝘳𝘦𝘵𝘦𝘯𝘵𝘪𝘰𝘯: 𝘯𝘰, ok";
  await expect(post).toHaveText(styled);

  await page.reload();
  await expect(post).toHaveText(styled, { timeout: 60_000 });
});

test("clears formatting from the selection, or else the whole post", async ({
  page,
}) => {
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });
  const clearFormatting = page.getByRole("button", {
    name: "Clear formatting",
  });

  // Selecting the first line clears only its heading.
  await page.getByRole("heading", { name: "Three lessons" }).selectText();
  await clearFormatting.click();
  await expect(post).toContainText(
    "Three lessons from a weekend project\n\nI turned a 𝗣𝘆𝘁𝗵𝗼𝗻",
  );

  // With nothing selected, everything goes: styles, lists, and code.
  await page.getByRole("textbox", { name: "Post" }).click();
  await clearFormatting.click();
  await expect(post).toContainText("I turned a Python package into a web page");
  await expect(post).toContainText(
    "Bold, italic, and both\ninline code and code blocks",
  );
  await expect(post).not.toContainText("•");
});

test("turns pasted Unicode styles into formatting the toolbar can change", async ({
  page,
}) => {
  await page.goto("./");
  const post = page.locator("#post");
  await expect(post).toContainText("𝗧𝗛𝗥𝗘𝗘", { timeout: 60_000 });
  await page.getByRole("button", { name: "Clear post" }).click();
  await expect(post).toHaveText("");

  // Text copied from LinkedIn: italic with an accent, bold, and monospace.
  const editor = page.getByRole("textbox", { name: "Post" });
  await editor.evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text/plain", "𝘤𝘢𝘧𝘦́ 𝘪𝘴 𝘧𝘳𝘦𝘦, 𝗯𝗼𝗹𝗱 and 𝚌𝚘𝚍𝚎");
    const paste = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, "clipboardData", { value: data });
    element.dispatchEvent(paste);
  });
  await expect(editor.locator("em")).toHaveText("café is free");
  await expect(editor.locator("strong")).toHaveText("bold");
  await expect(editor.locator("code")).toHaveText("code");
  await expect(post).toHaveText("𝘤𝘢𝘧𝘦́ 𝘪𝘴 𝘧𝘳𝘦𝘦, 𝗯𝗼𝗹𝗱 and 𝚌𝚘𝚍𝚎");

  await editor.locator("em").selectText();
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(post).toHaveText("𝙘𝙖𝙛𝙚́ 𝙞𝙨 𝙛𝙧𝙚𝙚, 𝗯𝗼𝗹𝗱 and 𝚌𝚘𝚍𝚎");
});

test("links to a privacy notice and back", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page).toHaveTitle("Privacy · LinkedIn Post Formatter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy");
  await expect(
    page.getByRole("heading", { name: "Your post stays with you" }),
  ).toBeVisible();

  // The masthead's theme toggle works here too.
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "← LinkedIn Post Formatter" }).click();
  await expect(page.getByRole("textbox", { name: "Post" })).toBeVisible();
});
