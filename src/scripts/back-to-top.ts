const THRESHOLD = 400;

function init() {
  const btn = document.getElementById("back-to-top") as HTMLButtonElement | null;
  if (!btn) return;

  function update() {
    btn!.dataset.visible = window.scrollY > THRESHOLD ? "true" : "false";
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

init();
document.addEventListener("astro:page-load", init);

export {};
