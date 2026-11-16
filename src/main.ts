import "./style.css";
import { type ChainedCommands, Editor } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Code,
  Copy,
  createIcons,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Moon,
  SquareCode,
  Sun,
  Trash2,
} from "lucide";
import type { ConvertRequest, ConvertResponse } from "./protocol.ts";
import sample from "./sample.md?raw";

const DRAFT_KEY = "linkedin-post-formatter:draft";
// Keys are prefixed because every app on the domain shares one localStorage.
const THEME_KEY = "linkedin-post-formatter:color-scheme";
// LinkedIn's limit for a post. Styled letters are two UTF-16 code units each,
// and counting those rather than code points errs on the side of fitting.
const POST_LIMIT = 3000;

// Storage is best-effort: it can be blocked, or full because the whole domain
// shares it, and the page must keep converting either way.
function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Nothing is kept for the next visit, which is the only loss.
  }
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const post = $("#post");
const count = $("#count");
const copyButton = $<HTMLButtonElement>("#copy");
const copyStatus = $(".copy .tip");
const errorBanner = $("#error");
const monospaceCode = $<HTMLInputElement>("#monospace-code");
const preserveLinks = $<HTMLInputElement>("#preserve-links");

createIcons({
  icons: {
    Bold,
    Check,
    Code,
    Copy,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Moon,
    SquareCode,
    Sun,
    Trash2,
  },
  attrs: { "aria-hidden": "true" },
});

// ── Theme ───────────────────────────────────────────────────────────────────
// The page follows the system scheme unless the reader overrides it. The
// toggle switches to the opposite of what is shown; switching back to the
// system's scheme clears the override rather than pinning it. CSS maps the
// meta tag to `color-scheme`, and the inline script in index.html applies a
// stored override before first paint.

const schemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')!;
const systemDark = matchMedia("(prefers-color-scheme: dark)");
const applyScheme = () => (schemeMeta.content = load(THEME_KEY) ?? "light dark");

$("#theme-toggle").addEventListener("click", () => {
  const system = systemDark.matches ? "dark" : "light";
  const shown = schemeMeta.content === "light dark" ? system : schemeMeta.content;
  const target = shown === "dark" ? "light" : "dark";
  const override = target === system ? null : target;
  save(THEME_KEY, override);
  schemeMeta.content = override ?? "light dark";
});
addEventListener("storage", ({ key }) => key === THEME_KEY && applyScheme());

// ── Editor ──────────────────────────────────────────────────────────────────

// The page has one h1, and the post's headings belong under the "Write" h2,
// so the editor draws heading levels 1 to 3 as h3 to h5. Only what is on
// screen changes: the clipboard and the Markdown still see levels 1 to 3.
const PostHeading = Heading.extend({
  addNodeView:
    () =>
    ({ node }) => {
      const dom = document.createElement(`h${Number(node.attrs["level"]) + 2}`);
      return { dom, contentDOM: dom };
    },
});

const editor = new Editor({
  element: $("#editor"),
  extensions: [
    // Only the formatting md2linkedin can express in Unicode is on offer.
    StarterKit.configure({
      blockquote: false,
      heading: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      link: { openOnClick: false },
    }),
    PostHeading.configure({ levels: [1, 2, 3] }),
    Markdown,
    Placeholder.configure({ placeholder: "Write your post…" }),
  ],
  content: load(DRAFT_KEY) ?? sample,
  contentType: "markdown",
  editorProps: {
    attributes: { "aria-label": "Post", "aria-multiline": "true", role: "textbox" },
  },
});

type Format = { run: (chain: ChainedCommands) => ChainedCommands; active: [string, object?] };

const formats: Record<string, Format> = {
  bold: { run: (c) => c.toggleBold(), active: ["bold"] },
  italic: { run: (c) => c.toggleItalic(), active: ["italic"] },
  code: { run: (c) => c.toggleCode(), active: ["code"] },
  h1: { run: (c) => c.toggleHeading({ level: 1 }), active: ["heading", { level: 1 }] },
  h2: { run: (c) => c.toggleHeading({ level: 2 }), active: ["heading", { level: 2 }] },
  bullets: { run: (c) => c.toggleBulletList(), active: ["bulletList"] },
  numbers: { run: (c) => c.toggleOrderedList(), active: ["orderedList"] },
  codeBlock: { run: (c) => c.toggleCodeBlock(), active: ["codeBlock"] },
};

const toolbar = $(".toolbar");
const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button")];
const isMac = /Mac|iP(hone|ad)/.test(navigator.userAgent);

for (const button of buttons) {
  const keys = button.dataset["keys"]!.split("-");
  const shortcut = isMac
    ? keys.map((k) => ({ Mod: "⌘", Alt: "⌥", Shift: "⇧" })[k] ?? k).join("")
    : keys.map((k) => ({ Mod: "Ctrl" })[k] ?? k).join("+");
  button.dataset["tip"] = `${button.ariaLabel} ${shortcut}`;
  button.setAttribute(
    "aria-keyshortcuts",
    keys.map((k) => ({ Mod: isMac ? "Meta" : "Control" })[k] ?? k).join("+"),
  );
  // Clicks keep focus and the selection in the editor; keyboard users still
  // reach the buttons through the toolbar's tab stop.
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => {
    formats[button.dataset["format"]!]!.run(editor.chain().focus()).run();
  });
}

const clearButton = $<HTMLButtonElement>("#clear");
clearButton.addEventListener("click", () => {
  if (clearButton.ariaDisabled === "true") return;
  editor.chain().focus().setContent("").run();
});

function syncToolbar() {
  clearButton.ariaDisabled = String(editor.isEmpty);
  for (const button of buttons) {
    button.ariaPressed = String(editor.isActive(...formats[button.dataset["format"]!]!.active));
  }
}

// One tab stop for the toolbar where the browser lacks native focusgroup.
if (!("focusGroup" in HTMLElement.prototype)) {
  buttons.forEach((b, i) => (b.tabIndex = i ? -1 : 0));
  toolbar.addEventListener("focusin", ({ target }) => {
    for (const b of buttons) b.tabIndex = b === target ? 0 : -1;
  });
  toolbar.addEventListener("keydown", (event) => {
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const n = buttons.length;
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[
      event.key
    ];
    if (i < 0 || next === undefined) return;
    event.preventDefault();
    buttons[next]!.focus();
  });
}

// ── Conversion ──────────────────────────────────────────────────────────────

const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
let latest = 0;
// The settled text of the latest request, or null while it is converting.
let ready: string | null = null;
// The text of the latest request, settled when its reply arrives. A copy made
// while a conversion is pending waits for it, so it never copies stale text.
let result = Promise.withResolvers<string>();

function convert() {
  ready = null;
  const next = Promise.withResolvers<string>();
  // A copy already waiting on the previous request waits for this one instead.
  result.resolve(next.promise);
  // Failures surface through the copy button and the error banner.
  next.promise.catch(() => undefined);
  result = next;
  const request: ConvertRequest = {
    id: ++latest,
    markdown: editor.getMarkdown(),
    preserveLinks: preserveLinks.checked,
    monospaceCode: monospaceCode.checked,
  };
  worker.postMessage(request);
}

worker.addEventListener("message", ({ data }: MessageEvent<ConvertResponse>) => {
  // Replies arrive in order; skip any that a newer edit has superseded.
  if (data.id !== latest) return;
  errorBanner.hidden = !("error" in data);
  if ("error" in data) {
    errorBanner.textContent = `The converter failed: ${data.error}`;
    result.reject(new Error(data.error));
    return;
  }
  const { text } = data;
  ready = text;
  result.resolve(text);
  post.textContent = text;
  post.classList.toggle("empty", !text);
  copyButton.ariaDisabled = String(!text);
  // The trailing newline the converter ends with is not part of the post.
  const length = text.trimEnd().length;
  const over = length > POST_LIMIT;
  count.classList.toggle("over", over);
  count.textContent = `${length.toLocaleString("en-GB")} / ${POST_LIMIT.toLocaleString("en-GB")}${over ? ", too long for a post" : ""}`;
});

editor.on("transaction", syncToolbar);
editor.on("update", () => {
  save(DRAFT_KEY, editor.getMarkdown());
  convert();
});
for (const option of [monospaceCode, preserveLinks]) {
  const key = `linkedin-post-formatter:${option.id}`;
  const saved = load(key);
  if (saved) option.checked = saved === "true";
  option.addEventListener("change", () => {
    save(key, String(option.checked));
    convert();
  });
}
syncToolbar();
convert();

// ── Copy ────────────────────────────────────────────────────────────────────

let resetCopy: ReturnType<typeof setTimeout> | undefined;

// The deprecated path, for browsers that refuse the Clipboard API. It only
// works while the click still counts as the user's gesture.
function legacyCopy(text: string) {
  const field = Object.assign(document.createElement("textarea"), { value: text });
  field.setAttribute("readonly", "");
  // 16px keeps iOS from zooming in on the field.
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0;font-size:16px";
  document.body.append(field);
  field.select();
  // iOS ignores select() on a textarea; it needs an explicit range.
  field.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
  }
}

async function writeLatest() {
  // Text that is ready is written straight away, inside the click's gesture,
  // which every browser accepts. A clipboard item backed by a promise is kept
  // for a click made while a conversion is pending, since Safari only accepts
  // a later write as the user's gesture in that form.
  if (ready === null && "ClipboardItem" in globalThis) {
    const blob = result.promise.then((value) => new Blob([value], { type: "text/plain" }));
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return;
    } catch {
      // Falls through to writing the text once it is ready.
    }
  }
  const text = ready ?? (await result.promise);
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    if (!legacyCopy(text)) throw error;
  }
}

copyButton.addEventListener("click", async () => {
  if (copyButton.ariaDisabled === "true") return;
  let ok = true;
  try {
    await writeLatest();
  } catch {
    ok = false;
  }
  clearTimeout(resetCopy);
  copyButton.toggleAttribute("data-copied", ok);
  copyButton.toggleAttribute("data-failed", !ok);
  copyStatus.textContent = "";
  requestAnimationFrame(() => (copyStatus.textContent = ok ? "Copied" : "Copy failed"));
  resetCopy = setTimeout(() => {
    copyButton.removeAttribute("data-copied");
    copyButton.removeAttribute("data-failed");
    copyStatus.textContent = "";
  }, 2000);
});
