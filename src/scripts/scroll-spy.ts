let currentObserver: IntersectionObserver | null = null;

function initScrollSpy() {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }

  const sections = document.querySelectorAll<HTMLElement>("main section[id]");
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]");
  if (sections.length === 0 || links.length === 0) return;

  const setActive = (id: string | null) => {
    links.forEach((link) => {
      const isActive = link.dataset.section === id;
      link.dataset.active = String(isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  currentObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
      if (visible.length > 0) {
        const id = (visible[0].target as HTMLElement).id;
        setActive(id);
      }
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((s) => currentObserver!.observe(s));
}

document.addEventListener("astro:page-load", initScrollSpy);
