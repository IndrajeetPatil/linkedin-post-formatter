// Records the README demo: a post written in light mode and copied, saved as
// docs/images/demo.gif. Needs ffmpeg and a running preview server:
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
await context.addInitScript(() => localStorage.setItem("linkedin-post-formatter:draft", ""));
const page = await context.newPage();
const started = Date.now();
await page.goto(url);
await page.locator("#post.empty").waitFor();
const trim = (Date.now() - started) / 1000;

const type = (text) => page.keyboard.type(text, { delay: 45 });
const press = (name) => page.getByRole("button", { name, exact: true }).click();

await page.getByRole("textbox", { name: "Post" }).click();
await press("Heading");
await type("Big news");
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
await press("Bulleted list");
await type("Python and ");
await press("Inline code");
await type("SQL");
await press("Inline code");
await page.keyboard.press("Enter");
await type("Fewer meetings, more shipping");
await page.keyboard.press("Enter");
await page.keyboard.press("Enter");
await type("Thank you all!");
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Copy text" }).click();
await page.waitForTimeout(1800);

const video = await page.video().path();
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
