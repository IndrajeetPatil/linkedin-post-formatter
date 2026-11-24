// Records the README demo, saved as docs/images/demo.gif: a post using every
// format and pasted emoji, the options, the dark theme, and copying. Needs ffmpeg and a running preview server:
//   PAGES_BASE=/linkedin-post-formatter/ vp build
//   PAGES_BASE=/linkedin-post-formatter/ vp preview --port 4173
//   node scripts/record-demo.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:4173/linkedin-post-formatter/";
const size = { width: 1280, height: 800 };
const videoDir = mkdtempSync(join(tmpdir(), "demo-"));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: size,
  colorScheme: "light",
  permissions: ["clipboard-read", "clipboard-write"],
  recordVideo: { dir: videoDir, size },
});
// Start from an empty editor rather than the sample post.
await context.addInitScript(() =>
  localStorage.setItem("linkedin-post-formatter:draft", ""),
);
const page = await context.newPage();
const started = Date.now();
await page.goto(url);
await page.locator("#post.empty").waitFor();
const trim = (Date.now() - started) / 1000;

/** @param {string} text */
const type = (text) => page.keyboard.type(text, { delay: 45 });
/** @param {string} name */
const press = (name) => page.getByRole("button", { name, exact: true }).click();

const editor = page.getByRole("textbox", { name: "Post" });
// Pastes HTML the way sites that draw emoji as images put it on the clipboard.
/** @param {string} emoji */
const pasteEmoji = (emoji) =>
  editor.evaluate((element, alt) => {
    const data = new DataTransfer();
    data.setData("text/html", `<img alt="${alt}" src="data:,">`);
    const paste = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, "clipboardData", { value: data });
    element.dispatchEvent(paste);
  }, emoji);

await editor.click();
await press("Heading");
await type("Big news ");
await pasteEmoji("🚀");
await page.keyboard.press("Enter");
await type("I am ");
await press("Bold");
await type("starting a new role");
await press("Bold");
await type(" as a ");
await press("Italic");
await type("data engineer");
await press("Italic");
await type(".");
await page.keyboard.press("Enter");
await press("Subheading");
await type("First steps");
await page.keyboard.press("Enter");
await press("Numbered list");
await type("Learn ");
await press("Inline code");
await type("dbt");
await press("Inline code");
await page.keyboard.press("Enter");
await type("Ship a pipeline");
await page.keyboard.press("Enter");
await page.keyboard.press("Enter");
await press("Code block");
await type("SELECT 'hello' AS team;");
await page.keyboard.press("Enter");
await page.keyboard.press("Enter");
await page.keyboard.press("Enter");
await press("Bulleted list");
await type("Thank you all! ");
await pasteEmoji("🙏🏽");
await page.waitForTimeout(800);
await page.getByLabel("Monospace code").uncheck();
await page.waitForTimeout(1000);
await page.getByLabel("Monospace code").check();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Switch to dark theme" }).click();
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Copy text" }).click();
await page.waitForTimeout(1800);

const video = await page.video()?.path();
if (!video) throw new Error("Video recording failed");
await context.close();
await browser.close();

const filter =
  "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4";
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-ss",
  String(trim),
  "-i",
  video,
  "-vf",
  filter,
  "docs/images/demo.gif",
]);
console.log("Wrote docs/images/demo.gif");
