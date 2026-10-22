// Full-page fit for the printed résumé. `resumeCSS` exposes vertical
// whitespace as `calc(<value> * var(--density))`; this measures the rendered
// document against the real printed page and picks densities so the page is
// FULL — no white tail and no ragged short column:
//
//   1. one document density, the highest at which the whole sheet still fits
//      `FILL_HEIGHT_MM` (it rises above 1 for short content and falls toward
//      the floor for long content), so the taller column reaches the bottom;
//   2. a separate, higher density on the shorter column (`main` or `aside`)
//      so its last line lands level with the taller one.
//
// Font sizes are never touched, only leading and vertical gaps.
// `fitResumeDocument` is the single entry point: /resume calls it live and
// scripts/resume-pdf.ts bundles this module into its headless page and calls
// the same function before printing, so screen and PDF cannot disagree.
//
// Geometry: an A4 page with `@page { margin: 0 }` and the sheet itself padded
// by `PAGE_MARGIN_Y_MM` / `PAGE_MARGIN_X_MM` (see `resumeCSS`). The margins live
// in the sheet, not in `@page`, because the browser print dialog draws its
// header/footer (date, title, URL, page number) inside the `@page` margin —
// with no margin there is nowhere to draw them.
// This module must stay import-free: the PDF script transpiles it standalone.

export const PX_PER_MM = 96 / 25.4;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;
export const PAGE_MARGIN_Y_MM = 13;
export const PAGE_MARGIN_X_MM = 14;
/** A4 height minus the sheet's top/bottom padding: 271mm. */
export const PRINTABLE_HEIGHT_MM = A4_HEIGHT_MM - PAGE_MARGIN_Y_MM * 2;
/**
 * A4 width minus the sheet's left/right padding: 182mm — the column width text
 * actually wraps against when printed. Measuring at a browser viewport width
 * instead understates height by ~15%, because narrower columns wrap more.
 */
export const CONTENT_WIDTH_MM = A4_WIDTH_MM - PAGE_MARGIN_X_MM * 2;
/**
 * Height the sheet is fitted to and pinned at in print. 1mm under the
 * printable height: a sheet exactly 271mm tall can round onto a second page.
 */
export const FILL_HEIGHT_MM = PRINTABLE_HEIGHT_MM - 1;
const FILL_HEIGHT_PX = FILL_HEIGHT_MM * PX_PER_MM;

/** Lowest document density; below ~0.75 body leading visibly crowds. */
export const DENSITY_FLOOR = 0.78;
/** Highest document density; past this short content reads as padded. */
export const DENSITY_CEILING = 1.5;
/** Highest density the shorter column may be stretched to. */
export const COLUMN_DENSITY_CEILING = 2.2;
/** Bisection rounds: brackets the answer to under 0.0001 density. */
const SEARCH_ROUNDS = 14;

export interface FitResult {
  /** Density of the whole sheet. */
  density: number;
  /** Which column was stretched to match the other, and to what density. */
  balanced: { column: "main" | "aside"; density: number } | null;
  /** Natural height of the fitted sheet, before the print pin. */
  heightPx: number;
  heightMm: number;
  /** False only when the content overflows one page even at the floor. */
  fits: boolean;
}

/**
 * Largest `d` in `[lo, hi]` with `measure(d) <= limit`, assuming `measure`
 * grows with `d` (more leading and margin never makes content shorter).
 * Returns `lo` when even `lo` exceeds the limit. Bounded loop.
 */
export async function maxDensityWithin(
  measure: (density: number) => number | Promise<number>,
  lo: number,
  hi: number,
  limitPx: number,
): Promise<number> {
  if ((await measure(hi)) <= limitPx) return hi;
  if ((await measure(lo)) > limitPx) return lo;
  for (let i = 0; i < SEARCH_ROUNDS; i++) {
    const mid = (lo + hi) / 2;
    if ((await measure(mid)) <= limitPx) lo = mid;
    else hi = mid;
  }
  return Number(lo.toFixed(4));
}

/**
 * Measures the résumé as it would print, independent of the on-screen
 * viewport, and returns the fitted densities.
 *
 * The live `.resume-doc` can't be measured in place: on screen it's governed
 * by `resumeCSS`'s `@media screen` rules, including a `max-width: 640px`
 * breakpoint that switches to a single-column layout — and `@media` tests the
 * viewport, not the element. Instead the résumé is rebuilt inside an
 * off-screen same-origin iframe wide enough (900px) that the mobile
 * breakpoint never matches, with `.resume-doc` pinned to the 182mm print
 * content width, unpinned in height so its NATURAL height is what's read, and
 * Inter loaded so the metrics match the printed font.
 */
async function fitResumeInBrowser(
  bodyHtml: string,
  css: string,
  fontUrl: string,
): Promise<FitResult> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.style.cssText =
    "position:fixed;top:0;left:-99999px;width:900px;height:50px;border:0;visibility:hidden;";
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    if (!doc || !doc.head || !doc.body) {
      return { density: 1, balanced: null, heightPx: 0, heightMm: 0, fits: true };
    }
    const style = doc.createElement("style");
    style.textContent =
      `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;` +
      `src:url("${fontUrl}") format("woff2")}html,body{margin:0;padding:0}${css}`;
    doc.head.appendChild(style);

    const sheet = doc.createElement("div");
    sheet.className = "resume-doc";
    sheet.innerHTML = bodyHtml;
    doc.body.appendChild(sheet);
    const main = sheet.querySelector<HTMLElement>(":scope > .layout > main");
    const aside = sheet.querySelector<HTMLElement>(":scope > .layout > aside");
    // Start from a clean slate if the live document was fitted before.
    main?.style.removeProperty("--density");
    aside?.style.removeProperty("--density");

    await Promise.all([doc.fonts.load('400 11px "Inter"'), doc.fonts.load('700 11px "Inter"')]);
    await doc.fonts.ready;

    const sheetHeight = (density: number): number => {
      sheet.setAttribute(
        "style",
        `--density:${density};width:${CONTENT_WIDTH_MM}mm;max-width:${CONTENT_WIDTH_MM}mm;` +
          "min-height:0;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;",
      );
      return sheet.getBoundingClientRect().height;
    };

    const density = await maxDensityWithin(sheetHeight, DENSITY_FLOOR, DENSITY_CEILING, FILL_HEIGHT_PX);
    const heightPx = sheetHeight(density);

    let balanced: FitResult["balanced"] = null;
    if (main && aside) {
      const mainPx = main.getBoundingClientRect().height;
      const asidePx = aside.getBoundingClientRect().height;
      const [short, column, targetPx] =
        mainPx < asidePx ? [main, "main" as const, asidePx] : [aside, "aside" as const, mainPx];
      const columnHeight = (d: number): number => {
        short.style.setProperty("--density", String(d));
        return short.getBoundingClientRect().height;
      };
      const columnDensity = await maxDensityWithin(
        columnHeight,
        density,
        Math.max(density, COLUMN_DENSITY_CEILING),
        targetPx,
      );
      short.style.removeProperty("--density");
      if (columnDensity > density) balanced = { column, density: columnDensity };
    }

    return {
      density,
      balanced,
      heightPx,
      heightMm: heightPx / PX_PER_MM,
      fits: heightPx <= FILL_HEIGHT_PX,
    };
  } finally {
    iframe.remove();
  }
}

/**
 * Fits a résumé sheet (by default the page's `[data-resume-doc]` element)
 * using the résumé styles in `#resume-css`, then applies the result:
 * `--density` on the sheet, a column override on the shorter column, and
 * `data-density` / `data-print-height-mm` on the sheet. Returns `undefined`
 * when there is no résumé to fit. Pass the element explicitly when its
 * content can be swapped while the fit runs (the admin variant preview), so
 * a stale result lands on the element it was measured for.
 */
export async function fitResumeDocument(
  fontUrl: string,
  docEl: HTMLElement | null = document.querySelector<HTMLElement>("[data-resume-doc]"),
): Promise<FitResult | undefined> {
  const css = document.getElementById("resume-css")?.textContent;
  if (!docEl || !css) return undefined;
  const result = await fitResumeInBrowser(docEl.innerHTML, css, fontUrl);
  docEl.style.setProperty("--density", String(result.density));
  for (const column of ["main", "aside"] as const) {
    const el = docEl.querySelector<HTMLElement>(`:scope > .layout > ${column}`);
    if (result.balanced?.column === column) {
      el?.style.setProperty("--density", String(result.balanced.density));
    } else {
      el?.style.removeProperty("--density");
    }
  }
  docEl.dataset.density = String(result.density);
  docEl.dataset.printHeightMm = result.heightMm.toFixed(1);
  return result;
}
