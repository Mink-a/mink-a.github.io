const SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

function initKonami() {
  let index = 0;
  window.addEventListener("keydown", (e) => {
    const expected = SEQUENCE[index];
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === expected) {
      index += 1;
      if (index === SEQUENCE.length) {
        document.body.dataset.konami = "true";
        index = 0;
      }
    } else {
      index = key === SEQUENCE[0] ? 1 : 0;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKonami);
} else {
  initKonami();
}
