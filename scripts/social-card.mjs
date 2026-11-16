// Renders the social card that link previews show, saved as
// public/social-card.png (1200×630). Uses the bundled fonts and the DESIGN.md
// tokens, so it needs no server:
//   vp run social-card
// The Unicode text is md2linkedin's own output for the Markdown on the left.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const font = (file) =>
  `url(data:font/woff2;base64,${readFileSync(require.resolve(`@fontsource-variable/${file}`)).toString("base64")}) format("woff2")`;

const html = `<!doctype html>
<html lang="en-GB">
<style>
  @font-face {
    font-family: "Fraunces Variable";
    font-weight: 100 900;
    src: ${font("fraunces/files/fraunces-latin-wght-normal.woff2")};
  }
  @font-face {
    font-family: "Hanken Grotesk Variable";
    font-weight: 100 900;
    src: ${font("hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2")};
  }
  @font-face {
    font-family: "Hanken Grotesk Variable";
    font-style: italic;
    font-weight: 100 900;
    src: ${font("hanken-grotesk/files/hanken-grotesk-latin-wght-italic.woff2")};
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; }
  body {
    display: flex;
    flex-direction: column;
    padding: 64px 80px 72px;
    background: #faf8f4;
    color: #201d18;
    font-family: "Hanken Grotesk Variable", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .site {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #5d574c;
    font-size: 24px;
    font-weight: 500;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #14584d;
    color: #faf8f4;
    font-family: "Fraunces Variable", serif;
    font-size: 30px;
    font-weight: 700;
  }
  h1 {
    margin-top: 40px;
    font-family: "Fraunces Variable", serif;
    font-size: 84px;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.015em;
  }
  .lede {
    margin-top: 20px;
    color: #5d574c;
    font-size: 32px;
    line-height: 1.35;
  }
  .pages {
    display: grid;
    grid-template-columns: 1fr 64px 1fr;
    align-items: center;
    margin-top: auto;
  }
  .panel {
    border: 1px solid #e3ded2;
    border-radius: 8px;
    background: #fdfcf9;
  }
  .panel header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 24px;
    border-bottom: 1px solid #e3ded2;
  }
  .panel h2 {
    font-family: "Fraunces Variable", serif;
    font-size: 24px;
    font-weight: 600;
  }
  .tools { display: flex; gap: 14px; color: #5d574c; }
  .tools svg { width: 24px; height: 24px; }
  .note { color: #5d574c; font-size: 20px; font-weight: 500; }
  .panel p {
    padding: 22px 24px 24px;
    font-size: 34px;
    line-height: 1.2;
    white-space: nowrap;
  }
  code {
    padding: 0 0.2em;
    border-radius: 4px;
    background: #f2efe8;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.9em;
  }
  .post { font-family: -apple-system, system-ui, sans-serif; }
  .arrow { justify-self: center; width: 40px; height: 40px; color: #14584d; }
</style>
<body>
  <div class="site"><span class="mark">¶</span>www.indrapatil.com</div>
  <h1>LinkedIn Post Formatter</h1>
  <p class="lede">Bold, italics, and code that LinkedIn keeps when you paste.</p>
  <div class="pages">
    <div class="panel">
      <header>
        <h2>Write</h2>
        <span class="tools" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 4h-9M14 20H5M15 4 9 20" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
          </svg>
        </span>
      </header>
      <p><b>Bold</b>, <i>italic</i>, and <code>code</code></p>
    </div>
    <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
    <div class="panel">
      <header>
        <h2>LinkedIn text</h2>
        <span class="note">Unicode</span>
      </header>
      <p class="post">𝗕𝗼𝗹𝗱, 𝘪𝘵𝘢𝘭𝘪𝘤, and 𝚌𝚘𝚍𝚎</p>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(async () => document.fonts.ready);
await page.screenshot({ path: "public/social-card.png" });
await browser.close();
console.log("Wrote public/social-card.png");
