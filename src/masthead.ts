// The masthead every page shares: its icons, and the colour scheme toggle.
import { createIcons, type IconNode, Moon, ShieldCheck, Sun } from "lucide";
import { load, save } from "./storage.ts";

const THEME_KEY = "linkedin-post-formatter:color-scheme";

// Draws the masthead's icons with any the page adds.
export function drawIcons(icons: Record<string, IconNode> = {}) {
  createIcons({ icons: { Moon, ShieldCheck, Sun, ...icons }, attrs: { "aria-hidden": "true" } });
}

// The page follows the system scheme unless the reader overrides it. The
// toggle switches to the opposite of what is shown; switching back to the
// system's scheme clears the override rather than pinning it. CSS maps the
// meta tag to `color-scheme`, and an inline script in each page's head
// applies a stored override before first paint.
const schemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')!;
const systemDark = matchMedia("(prefers-color-scheme: dark)");
const applyScheme = () => (schemeMeta.content = load(THEME_KEY) ?? "light dark");

document.querySelector("#theme-toggle")!.addEventListener("click", () => {
  const system = systemDark.matches ? "dark" : "light";
  const shown = schemeMeta.content === "light dark" ? system : schemeMeta.content;
  const target = shown === "dark" ? "light" : "dark";
  const override = target === system ? null : target;
  save(THEME_KEY, override);
  schemeMeta.content = override ?? "light dark";
});
addEventListener("storage", ({ key }) => key === THEME_KEY && applyScheme());
