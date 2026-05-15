const SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

let activated = false;
let index = 0;

function onKeyDown(e: KeyboardEvent) {
  const expected = SEQUENCE[index];
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === expected) {
    index += 1;
    if (index === SEQUENCE.length) {
      activated = true;
      document.body.dataset.konami = "true";
      index = 0;
    }
  } else {
    index = key === SEQUENCE[0] ? 1 : 0;
  }
}

function reapply() {
  // Astro View Transitions swap <body>; re-apply the flag if it was previously activated.
  if (activated) {
    document.body.dataset.konami = "true";
  }
}

window.addEventListener("keydown", onKeyDown);
document.addEventListener("astro:after-swap", reapply);
document.addEventListener("astro:page-load", reapply);
