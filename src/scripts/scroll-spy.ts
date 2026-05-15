// Scroll-position based active-section tracking.
//
// IntersectionObserver with a center-viewport rootMargin felt off when sections
// have very different heights — short sections (About) never reach the trigger
// band before the next section takes over. This implementation matches what
// most users intuit: the "active" section is the one whose top has scrolled
// past a fixed offset near the viewport top.

const OFFSET = 100; // px from viewport top
let bound = false;
let scheduled = false;

function getActiveSectionId(): string | null {
  const sections = document.querySelectorAll<HTMLElement>("main section[id]");
  if (sections.length === 0) return null;

  let activeId: string | null = null;
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= OFFSET) {
      activeId = section.id;
    } else {
      break; // sections are in document order; remainder are below the offset.
    }
  }

  // Above the first section → still highlight the first one so the sidebar
  // never looks "empty."
  if (activeId === null) {
    activeId = sections[0].id;
  }
  return activeId;
}

function setActive(id: string | null) {
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]");
  links.forEach((link) => {
    const isActive = id !== null && link.dataset.section === id;
    link.dataset.active = String(isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function onScroll() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    setActive(getActiveSectionId());
    scheduled = false;
  });
}

function initScrollSpy() {
  if (!bound) {
    window.addEventListener("scroll", onScroll, { passive: true });
    bound = true;
  }
  // Re-evaluate immediately on every page load (covers View Transitions).
  onScroll();
}

document.addEventListener("astro:page-load", initScrollSpy);
