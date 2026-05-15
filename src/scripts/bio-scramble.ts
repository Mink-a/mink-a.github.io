// Cycling-bio text-scramble effect.
//
// Cycles the sidebar bio through a small set of punchy lines. Each transition
// "decrypts" the new line — every character flips through a stream of random
// glyphs before locking to its final value. Adapted from the canonical
// TextScramble pattern.

const BIOS = [
  "Seeking the 'why.' Engineering the 'how.' Fuelled by curiosity.",
  "Making the complex look simple.",
  "Imagining systems. Engineering solutions.",
];

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#$%&abcdefghijklmnopqrstuvwxyz0123456789";

interface QueueItem {
  from: string;
  to: string;
  start: number;
  end: number;
  char?: string;
}

class TextScramble {
  el: HTMLElement;
  frameRequest = 0;
  frame = 0;
  queue: QueueItem[] = [];
  resolveFn: () => void = () => {};
  cancelled = false;

  constructor(el: HTMLElement) {
    this.el = el;
    this.update = this.update.bind(this);
  }

  setText(newText: string): Promise<void> {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.cancelled = false;
    return new Promise<void>((resolve) => {
      this.resolveFn = resolve;
      this.update();
    });
  }

  update() {
    if (this.cancelled) return;
    let output = "";
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      const item = this.queue[i];
      if (this.frame >= item.end) {
        complete++;
        output += item.to;
      } else if (this.frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        output += `<span class="opacity-60">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolveFn();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  cancel() {
    this.cancelled = true;
    cancelAnimationFrame(this.frameRequest);
  }
}

let activeFx: TextScramble | null = null;
let activeTimer: number | null = null;
let activeIndex = 0;

function cleanup() {
  if (activeTimer !== null) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (activeFx) {
    activeFx.cancel();
    activeFx = null;
  }
}

function init() {
  cleanup();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Reduced-motion: show the first bio statically, no cycling.
    return;
  }

  const el = document.querySelector<HTMLElement>("[data-bio-target]");
  if (!el) return;

  // Sync our cycle index with what the server rendered (BIOS[0]).
  activeIndex = 0;
  const fx = new TextScramble(el);
  activeFx = fx;

  const next = () => {
    activeIndex = (activeIndex + 1) % BIOS.length;
    fx.setText(BIOS[activeIndex]).then(() => {
      if (activeFx !== fx) return; // a newer cycle has taken over
      activeTimer = window.setTimeout(next, 5000);
    });
  };

  // First scramble after a beat — let the user read the initial bio.
  activeTimer = window.setTimeout(next, 4000);
}

document.addEventListener("astro:page-load", init);
