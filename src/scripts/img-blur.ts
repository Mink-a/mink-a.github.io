// Blur-up reveal: fade the full image in once it decodes, leaving the inline
// ThumbHash placeholder (wrapper background) visible until then. Gated on the
// `html.js` class in CSS so images stay visible when JS is unavailable.

function reveal(img: HTMLImageElement) {
  img.dataset.loaded = "true";
}

function init() {
  const imgs = document.querySelectorAll<HTMLImageElement>(
    "img.blur-up:not([data-loaded])",
  );
  imgs.forEach((img) => {
    // Cached images may already be complete before this runs.
    if (img.complete && img.naturalWidth > 0) {
      reveal(img);
      return;
    }
    img.addEventListener("load", () => reveal(img), { once: true });
    // Don't trap a broken image behind the placeholder forever.
    img.addEventListener("error", () => reveal(img), { once: true });
  });
}

init();
document.addEventListener("astro:page-load", init);

export {};
