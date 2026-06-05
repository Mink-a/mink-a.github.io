// Reader-facing inline AI translation for writing posts. Offers the visitor's
// browser language plus an English option, swaps the prose in place (leaving code
// blocks, images, and structure untouched), and toggles back to the original.
// Scoped to [data-post-body] / [data-translate]; re-runs on View Transitions.

const LANG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;

// Leaf text blocks we translate. Anything containing a nested block or a <pre>
// is skipped (its leaf descendants are translated instead).
const BLOCK_SEL = "p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, th, td, dt, dd";
const INLINE_OK: Record<string, true> = {
  A: true, CODE: true, STRONG: true, EM: true, B: true, I: true, U: true, S: true,
  SPAN: true, BR: true, SUP: true, SUB: true, MARK: true, SMALL: true, ABBR: true,
  KBD: true, Q: true, DEL: true, INS: true, WBR: true,
};

function baseLang(tag: string | null | undefined): string {
  return (tag || "").trim().toLowerCase().split("-")[0] || "";
}

function endonym(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Keep only a safe inline subset; unwrap anything else to its text. */
function sanitizeInline(html: string): string {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const drop: Element[] = [];
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
  let el = walker.nextNode() as Element | null;
  while (el) {
    if (INLINE_OK[el.tagName]) {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) el.removeAttribute(attr.name);
        else if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    } else {
      drop.push(el);
    }
    el = walker.nextNode() as Element | null;
  }
  for (const node of drop) node.replaceWith(document.createTextNode(node.textContent ?? ""));
  return tpl.innerHTML;
}

function collectBlocks(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SEL)).filter(
    (el) => !el.querySelector(BLOCK_SEL) && !el.querySelector("pre") && el.textContent!.trim().length > 0,
  );
}

function init(): void {
  const body = document.querySelector<HTMLElement>("[data-post-body]");
  const mount = document.querySelector<HTMLElement>("[data-translate]");
  if (!body || !mount || mount.dataset.ready) return;
  mount.dataset.ready = "1";

  const source = baseLang(body.getAttribute("lang")) || "en";
  const browser = baseLang(navigator.language);

  const targets: string[] = [];
  if (source !== "en") targets.push("en");
  if (browser && browser !== source && !targets.includes(browser)) targets.push(browser);
  if (targets.length === 0) return; // nothing useful to offer

  const blocks = collectBlocks(body);
  if (blocks.length === 0) return;
  const originals = blocks.map((b) => b.innerHTML);
  const cache = new Map<string, string[]>();
  let active: string | null = null;
  let busy = false;

  // --- UI ---------------------------------------------------------------
  const divider = document.createElement("span");
  divider.className = "post-toolbar-divider";
  const label = document.createElement("span");
  label.className = "post-toolbar-label";
  label.innerHTML = `${LANG_SVG}<span>Translate</span>`;
  mount.appendChild(divider);
  mount.appendChild(label);

  const buttons = new Map<string, HTMLButtonElement>();
  const chip = (text: string): HTMLButtonElement => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "post-chip";
    b.textContent = text;
    mount.appendChild(b);
    return b;
  };

  for (const t of targets) {
    const b = chip(endonym(t));
    b.dataset.label = endonym(t);
    b.addEventListener("click", () => void translateTo(t, b));
    buttons.set(t, b);
  }

  const originalBtn = chip("Original");
  originalBtn.hidden = true;
  originalBtn.addEventListener("click", showOriginal);

  function setBusy(on: boolean): void {
    busy = on;
    for (const b of buttons.values()) b.disabled = on;
  }

  function render(html: string[]): void {
    blocks.forEach((b, i) => {
      b.innerHTML = sanitizeInline(html[i] ?? originals[i]);
    });
  }

  function showOriginal(): void {
    if (busy) return;
    blocks.forEach((b, i) => (b.innerHTML = originals[i]));
    body!.setAttribute("lang", source);
    active = null;
    originalBtn.hidden = true;
    for (const b of buttons.values()) b.classList.remove("is-active");
  }

  async function translateTo(target: string, btn: HTMLButtonElement): Promise<void> {
    if (busy || active === target) return;

    if (cache.has(target)) {
      render(cache.get(target)!);
      markActive(target);
      return;
    }

    setBusy(true);
    btn.textContent = "Translating…";
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, source, segments: originals }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { translations?: unknown };
      const out = data.translations;
      if (!Array.isArray(out) || out.length !== originals.length) {
        throw new Error("bad response");
      }
      const html = out.map(String);
      cache.set(target, html);
      render(html);
      markActive(target);
    } catch {
      btn.textContent = "Failed — retry";
      window.setTimeout(() => (btn.textContent = btn.dataset.label ?? endonym(target)), 2200);
    } finally {
      setBusy(false);
      if (btn.textContent === "Translating…") btn.textContent = btn.dataset.label ?? endonym(target);
    }
  }

  function markActive(target: string): void {
    active = target;
    body!.setAttribute("lang", target);
    originalBtn.hidden = false;
    for (const [t, b] of buttons) {
      b.classList.toggle("is-active", t === target);
      b.textContent = b.dataset.label ?? endonym(t);
    }
  }
}

init();
document.addEventListener("astro:page-load", init);

export {};
