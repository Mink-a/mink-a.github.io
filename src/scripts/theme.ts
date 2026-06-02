type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === "light" ? "light" : "dark";
}

function applyTheme(t: Theme) {
  const html = document.documentElement;
  html.classList.add("theme-transitioning");
  if (t === "light") {
    html.dataset.theme = "light";
  } else {
    delete html.dataset.theme;
  }
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {}
  window.setTimeout(() => html.classList.remove("theme-transitioning"), 260);
}

function toggle() {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

function bind() {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-toggle]",
  );
  for (const btn of buttons) {
    if (btn.dataset.themeBound === "1") continue;
    btn.dataset.themeBound = "1";
    btn.addEventListener("click", toggle);
  }
}

bind();
document.addEventListener("astro:page-load", bind);

// View Transitions: Astro's ClientRouter swaps documentElement attributes
// when navigating, which wipes our data-theme. Re-apply on the incoming
// document before swap so the new page renders in the right mode.
document.addEventListener("astro:before-swap", (e: Event) => {
  const ev = e as Event & { newDocument: Document };
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {}
  const wantLight = stored
    ? stored === "light"
    : window.matchMedia("(prefers-color-scheme: light)").matches;
  if (wantLight) {
    ev.newDocument.documentElement.dataset.theme = "light";
  } else {
    delete ev.newDocument.documentElement.dataset.theme;
  }
});

export {};
