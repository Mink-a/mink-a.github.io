// Writing-post tools: per-code-block copy buttons, a "Copy page" (Markdown)
// button, and AI "Open in …" links. Scoped to elements the writing template
// renders ([data-post] / [data-post-toolbar]); no-ops elsewhere. Re-runs on
// View Transitions via astro:page-load and guards against double-init.

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Briefly swap a button's label/icon to confirm an action, then restore. */
function flash(el: HTMLElement, opts: { html?: string; label?: string }): void {
  const icon = el.querySelector<HTMLElement>("[data-icon]");
  const label = el.querySelector<HTMLElement>("[data-label]");
  if (el.dataset.flashing) return;
  el.dataset.flashing = "1";

  const prevIcon = icon?.innerHTML;
  const prevLabel = label?.textContent;
  if (opts.html && icon) icon.innerHTML = opts.html;
  if (opts.label && label) label.textContent = opts.label;
  el.classList.add("is-copied");

  window.setTimeout(() => {
    if (icon && prevIcon !== undefined) icon.innerHTML = prevIcon;
    if (label && prevLabel !== undefined) label.textContent = prevLabel;
    el.classList.remove("is-copied");
    delete el.dataset.flashing;
  }, 1600);
}

function addCodeCopyButtons(root: Element): void {
  root.querySelectorAll<HTMLPreElement>("pre").forEach((pre) => {
    if (pre.dataset.copyReady) return;
    pre.dataset.copyReady = "1";

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const actions = document.createElement("div");
    actions.className = "code-block__actions";

    // Tiny language tag in the top-right corner, above the copy icon.
    const lang = pre.dataset.language;
    if (lang && !["text", "plaintext", "plain", "txt", "ansi"].includes(lang)) {
      const tag = document.createElement("span");
      tag.className = "code-lang";
      tag.textContent = lang;
      actions.appendChild(tag);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = COPY_SVG;
    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
      if (await copyText(code.replace(/\n$/, ""))) {
        btn.classList.add("is-copied");
        btn.innerHTML = CHECK_SVG;
        btn.setAttribute("aria-label", "Copied");
        window.setTimeout(() => {
          btn.classList.remove("is-copied");
          btn.innerHTML = COPY_SVG;
          btn.setAttribute("aria-label", "Copy code");
        }, 1600);
      }
    });
    actions.appendChild(btn);
    wrapper.appendChild(actions);
  });
}

function wireToolbar(toolbar: HTMLElement): void {
  if (toolbar.dataset.toolReady) return;
  toolbar.dataset.toolReady = "1";

  const mdUrl = toolbar.dataset.mdUrl;
  const prompt = toolbar.dataset.prompt ?? "";

  const copyBtn = toolbar.querySelector<HTMLButtonElement>("[data-copy-page]");
  if (copyBtn && mdUrl) {
    copyBtn.addEventListener("click", async () => {
      try {
        const md = await (await fetch(mdUrl)).text();
        if (await copyText(md)) flash(copyBtn, { label: "Copied" });
      } catch {
        /* leave the button unchanged on failure */
      }
    });
  }

  // For providers without working URL prefill (data-copy="true"), copy the
  // prompt so the user can paste; the link itself opens the app in a new tab.
  toolbar.querySelectorAll<HTMLAnchorElement>('[data-llm][data-copy="true"]').forEach((link) => {
    link.addEventListener("click", () => {
      void copyText(prompt).then((ok) => {
        if (ok) flash(link, { label: "Prompt copied" });
      });
    });
  });
}

function init(): void {
  const post = document.querySelector("[data-post]");
  if (post) addCodeCopyButtons(post);

  const toolbar = document.querySelector<HTMLElement>("[data-post-toolbar]");
  if (toolbar) wireToolbar(toolbar);
}

init();
document.addEventListener("astro:page-load", init);

export {};
