const html = document.documentElement;

document.addEventListener("astro:before-preparation", () => {
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
});

document.addEventListener("astro:after-swap", () => {
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    html.style.scrollBehavior = "";
  });
});
