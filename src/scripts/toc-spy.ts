const TOC_OFFSET = 120;

function init() {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"),
  );
  if (links.length === 0) return;

  const sections = links
    .map((link) => {
      const id = link.dataset.section!;
      const el = document.getElementById(id);
      if (!el) return null;
      return {
        id,
        el,
        depth: Number(link.dataset.depth || "2"),
      };
    })
    .filter(
      (x): x is { id: string; el: HTMLElement; depth: number } => x !== null,
    );

  if (sections.length === 0) return;

  function absoluteTop(el: HTMLElement) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function update() {
    const y = window.scrollY + TOC_OFFSET;
    let activeIndex = 0;
    for (let i = 0; i < sections.length; i++) {
      if (absoluteTop(sections[i].el) <= y) activeIndex = i;
      else break;
    }

    const active = sections[activeIndex];
    let parentId: string | null = null;
    if (active.depth > 2) {
      for (let i = activeIndex - 1; i >= 0; i--) {
        if (sections[i].depth < active.depth) {
          parentId = sections[i].id;
          break;
        }
      }
    }

    for (const link of links) {
      const id = link.dataset.section!;
      if (id === active.id) {
        link.dataset.active = "true";
        link.dataset.activeParent = "false";
      } else if (id === parentId) {
        link.dataset.active = "false";
        link.dataset.activeParent = "true";
      } else {
        link.dataset.active = "false";
        link.dataset.activeParent = "false";
      }
    }
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}

init();
document.addEventListener("astro:page-load", init);

export {};
