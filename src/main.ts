import "./style.css";
import {
  type ChainedCommands,
  Editor,
  Extension,
  type JSONContent,
} from "@tiptap/core";
import BoldMark from "@tiptap/extension-bold";
import Heading from "@tiptap/extension-heading";
import ItalicMark from "@tiptap/extension-italic";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import {
  Fragment,
  type Node as ProseMirrorNode,
  type Schema,
  Slice,
} from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Code,
  Copy,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  SquareCode,
  Trash2,
} from "lucide";
import { drawIcons } from "./masthead.ts";
import type { ConvertRequest, ConvertResponse } from "./protocol.ts";
import sample from "./sample.md?raw";
import { load, save } from "./storage.ts";

const DRAFT_KEY = "linkedin-post-formatter:draft";
// LinkedIn's limit for a post. Styled letters are two UTF-16 code units each,
// and counting those rather than code points errs on the side of fitting.
const POST_LIMIT = 3000;

const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const post = $("#post");
const count = $("#count");
const copyButton = $<HTMLButtonElement>("#copy");
const copyStatus = $(".copy .tip");
const errorBanner = $("#error");
const monospaceCode = $<HTMLInputElement>("#monospace-code");
const preserveLinks = $<HTMLInputElement>("#preserve-links");

drawIcons({
  Bold,
  Check,
  Code,
  Copy,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  SquareCode,
  Trash2,
});

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

// Bold and italic go to md2linkedin as HTML tags. Markdown's `*` and `**`
// only count when they flank words in particular ways, so overlapping or
// partial styles, such as italic ending where a bold colon begins, serialise
// to delimiters that parse as literal asterisks; tags have no such rules.
const HtmlBold = BoldMark.extend({
  renderMarkdown: (node, h) => `<strong>${h.renderChildren(node)}</strong>`,
});
const HtmlItalic = ItalicMark.extend({
  renderMarkdown: (node, h) => `<em>${h.renderChildren(node)}</em>`,
});

// Turns the selection, or the whole post when nothing is selected, into plain
// paragraphs, as pasted text often brings formatting along.
const clearFormatting = (chain: ChainedCommands) =>
  chain
    .command(
      ({ state, commands }) => state.selection.empty && commands.selectAll(),
    )
    .unsetAllMarks()
    .clearNodes();

const ClearFormatting = Extension.create({
  name: "clearFormatting",
  addKeyboardShortcuts() {
    return { "Mod-\\": () => clearFormatting(this.editor.chain()).run() };
  },
});

// Gmail, X, Facebook, and other sites draw emoji as images with the character
// in `alt`, and copy them that way. The editor keeps no images, so it would
// drop them; paste the characters instead.
const EMOJI = /^\p{RGI_Emoji}+$/v;

function unwrapEmojiImages(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const images = [...doc.images].filter((img) => EMOJI.test(img.alt));
  if (!images.length) return html;
  for (const img of images) img.replaceWith(img.alt);
  return doc.body.innerHTML;
}

// The draft is kept as the editor's JSON, which reloads exactly; Markdown
// would lose spaces at some style boundaries. A Markdown draft still loads.
function loadDraft(): {
  content: string | JSONContent;
  contentType: "json" | "markdown";
} {
  const draft = load(DRAFT_KEY);
  if (draft === null) return { content: sample, contentType: "markdown" };
  try {
    const doc: unknown = JSON.parse(draft);
    if ((doc as JSONContent | null)?.type === "doc") {
      return { content: doc as JSONContent, contentType: "json" };
    }
  } catch {
    // Not JSON, so a Markdown draft.
  }
  return { content: draft, contentType: "markdown" };
}

// Text copied from LinkedIn, or from this page's own output, spells its styles
// in Unicode Mathematical Alphanumeric letters. md2linkedin restyles only
// plain letters, so such text would ignore the toolbar. Pasting turns those
// letters back into plain ones carrying the matching marks.
const MATH = /[\u{1D400}-\u{1D7FF}]/u;
// The block's 52-letter alphabets, in order, and the marks of those that
// mean something here (the rest, such as script, paste as plain letters).
const LETTERS = [
  "bold",
  "italic",
  "bold italic",
  "",
  "",
  "",
  "",
  "",
  "",
  "bold",
  "italic",
  "bold italic",
  "code",
];
// Its runs of ten digits: bold, double-struck, sans, sans bold, and monospace.
const DIGITS = ["bold", "", "", "bold", "code"];

// The marks a character's style stands for, separated by spaces, or null for
// a character outside the block.
function mathStyle(codePoint: number): string | null {
  if (codePoint < 0x1d400 || codePoint > 0x1d7ff) return null;
  if (codePoint < 0x1d6a4)
    return LETTERS[Math.floor((codePoint - 0x1d400) / 52)] ?? "";
  // Greek letters, which md2linkedin never writes, come before the digits.
  return DIGITS[Math.floor((codePoint - 0x1d7ce) / 10)] ?? "";
}

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

function unstyleText(
  node: ProseMirrorNode,
  parent: ProseMirrorNode,
  schema: Schema,
) {
  // Graphemes keep an accent with the styled letter before it.
  const chars = Array.from(
    graphemes.segment(node.text!),
    ({ segment }) => segment,
  );
  // Each character's styles, or null for one with no styled form, such as a
  // space or punctuation, which joins the styles on both sides when they match.
  const own = chars.map((char) => mathStyle(char.codePointAt(0)!));
  const after: (string | null)[] = [];
  for (let i = own.length - 1, next = null; i >= 0; i--) {
    after[i] = next;
    next = own[i] ?? next;
  }
  let before: string | null = null;
  const styles = own.map((style, i) => {
    if (style === null)
      return before !== null && before === after[i] ? before : "";
    before = style;
    return style;
  });
  const nodes: ProseMirrorNode[] = [];
  let start = 0;
  for (let i = 1; i <= chars.length; i++) {
    if (i < chars.length && styles[i] === styles[start]) continue;
    const text = chars
      .slice(start, i)
      .map((char) => (MATH.test(char) ? char.normalize("NFKC") : char))
      .join("")
      .normalize("NFC");
    let marks = node.marks;
    for (const name of styles[start]!.split(" ").filter(Boolean)) {
      const type = schema.marks[name]!;
      if (parent.type.allowsMarkType(type))
        marks = type.create().addToSet(marks);
    }
    nodes.push(schema.text(text, marks));
    start = i;
  }
  return nodes;
}

function unstyleFragment(
  fragment: Fragment,
  parent: ProseMirrorNode,
  schema: Schema,
): Fragment {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    if (node.isText && MATH.test(node.text!)) {
      nodes.push(...unstyleText(node, parent, schema));
    } else {
      nodes.push(node.copy(unstyleFragment(node.content, node, schema)));
    }
  });
  return Fragment.from(nodes);
}

function unstylePasted(
  slice: Slice,
  view: { state: { schema: Schema; doc: ProseMirrorNode } },
) {
  const { schema, doc } = view.state;
  return new Slice(
    unstyleFragment(slice.content, doc, schema),
    slice.openStart,
    slice.openEnd,
  );
}

const editor = new Editor({
  element: $("#editor"),
  extensions: [
    // Only the formatting md2linkedin can express in Unicode is on offer.
    StarterKit.configure({
      blockquote: false,
      bold: false,
      italic: false,
      heading: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      link: { openOnClick: false },
    }),
    HtmlBold,
    HtmlItalic,
    PostHeading.configure({ levels: [1, 2, 3] }),
    ClearFormatting,
    Markdown,
    Placeholder.configure({ placeholder: "Write your post…" }),
  ],
  ...loadDraft(),
  editorProps: {
    attributes: {
      "aria-label": "Post",
      "aria-multiline": "true",
      role: "textbox",
    },
    transformPastedHTML: unwrapEmojiImages,
    transformPasted: unstylePasted,
  },
});

type Format = {
  run: (chain: ChainedCommands) => ChainedCommands;
  active: [string, object?];
};

const formats: Record<string, Format> = {
  bold: { run: (c) => c.toggleBold(), active: ["bold"] },
  italic: { run: (c) => c.toggleItalic(), active: ["italic"] },
  code: { run: (c) => c.toggleCode(), active: ["code"] },
  h1: {
    run: (c) => c.toggleHeading({ level: 1 }),
    active: ["heading", { level: 1 }],
  },
  h2: {
    run: (c) => c.toggleHeading({ level: 2 }),
    active: ["heading", { level: 2 }],
  },
  bullets: { run: (c) => c.toggleBulletList(), active: ["bulletList"] },
  numbers: { run: (c) => c.toggleOrderedList(), active: ["orderedList"] },
  codeBlock: { run: (c) => c.toggleCodeBlock(), active: ["codeBlock"] },
};

const toolbar = $(".toolbar");
const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button")];
const isMac = /Mac|iP(hone|ad)/.test(navigator.userAgent);

const clearButton = $<HTMLButtonElement>("#clear");
const clearFormattingButton = $<HTMLButtonElement>("#clear-formatting");

for (const button of [...buttons, clearFormattingButton]) {
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
  // reach the buttons with Tab, and the editor keeps its selection meanwhile.
  button.addEventListener("mousedown", (event) => event.preventDefault());
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    formats[button.dataset["format"]!]!.run(editor.chain().focus()).run();
  });
}

clearFormattingButton.addEventListener("click", () => {
  if (clearFormattingButton.ariaDisabled === "true") return;
  clearFormatting(editor.chain().focus()).run();
});

clearButton.addEventListener("click", () => {
  if (clearButton.ariaDisabled === "true") return;
  editor.chain().focus().setContent("").run();
});

function syncToolbar() {
  clearButton.ariaDisabled = String(editor.isEmpty);
  clearFormattingButton.ariaDisabled = String(editor.isEmpty);
  for (const button of buttons) {
    button.ariaPressed = String(
      editor.isActive(...formats[button.dataset["format"]!]!.active),
    );
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
    const next = {
      ArrowRight: (i + 1) % n,
      ArrowLeft: (i - 1 + n) % n,
      Home: 0,
      End: n - 1,
    }[event.key];
    if (i < 0 || next === undefined) return;
    event.preventDefault();
    buttons[next]!.focus();
  });
}

// ── Conversion ──────────────────────────────────────────────────────────────

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});
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
  next.promise.catch(() => {});
  result = next;
  const request: ConvertRequest = {
    id: ++latest,
    markdown: editor.getMarkdown(),
    preserveLinks: preserveLinks.checked,
    monospaceCode: monospaceCode.checked,
  };
  worker.postMessage(request);
}

worker.addEventListener(
  "message",
  ({ data }: MessageEvent<ConvertResponse>) => {
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
  },
);

editor.on("transaction", syncToolbar);
editor.on("update", () => {
  save(DRAFT_KEY, JSON.stringify(editor.getJSON()));
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

async function writeLatest() {
  // Text that is ready is written straight away, inside the click's gesture,
  // which every browser accepts. A clipboard item backed by a promise is kept
  // for a click made while a conversion is pending, since Safari only accepts
  // a later write as the user's gesture in that form.
  if (ready === null && "ClipboardItem" in globalThis) {
    const blob = result.promise.then(
      (value) => new Blob([value], { type: "text/plain" }),
    );
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": blob }),
      ]);
      return;
    } catch {
      // Falls through to writing the text once it is ready.
    }
  }
  const text = ready ?? (await result.promise);
  await navigator.clipboard.writeText(text);
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
  requestAnimationFrame(
    () => (copyStatus.textContent = ok ? "Copied" : "Copy failed"),
  );
  resetCopy = setTimeout(() => {
    copyButton.removeAttribute("data-copied");
    copyButton.removeAttribute("data-failed");
    copyStatus.textContent = "";
  }, 2000);
});
