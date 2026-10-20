// One-page fit for the printed résumé. `resumeCSS` exposes vertical whitespace
// as `calc(<value> * var(--density))`; this measures the rendered document
// against the real printed page and steps `--density` down only as far as
// needed — never stretching a short résumé, never crushing a long one past a
// readable floor. Shared by src/pages/resume/[variant].astro (in the browser)
// and scripts/resume-pdf.ts (in headless Chromium), so both pick the same
// density for the same content.
//
// Geometry mirrors the `@page { size: A4; margin: 13mm 14mm }` rule in
// `resumeCSS`.

export const PX_PER_MM = 96 / 25.4;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;
const PAGE_MARGIN_Y_MM = 13;
const PAGE_MARGIN_X_MM = 14;
/** A4 height minus the `@page` top/bottom margins: 271mm. */
export const PRINTABLE_HEIGHT_MM = A4_HEIGHT_MM - PAGE_MARGIN_Y_MM * 2;
/**
 * A4 width minus the `@page` left/right margins: 182mm — the column width text
 * actually wraps against when printed. Measuring at a browser viewport width
 * instead understates height by ~15%, because narrower columns wrap more.
 */
export const CONTENT_WIDTH_MM = A4_WIDTH_MM - PAGE_MARGIN_X_MM * 2;
/** Lowest density the fitter will use; below ~0.7 body leading visibly crowds. */
export const DENSITY_FLOOR = 0.78;
export const DENSITY_STEP = 0.02;
/**
 * Fraction of the printable height to fill. Fitting to 100% lands the last
 * line flush against the page edge; 96% leaves a visible foot of white space.
 */
export const TARGET_FILL = 0.96;
export const TARGET_HEIGHT_PX = PRINTABLE_HEIGHT_MM * PX_PER_MM * TARGET_FILL;

export interface FitResult {
  density: number;
  heightPx: number;
  heightMm: number;
  /** Whether `heightPx` is within the target (false only at the floor). */
  fits: boolean;
}

/**
 * Picks the highest density in `[DENSITY_FLOOR, 1]` (stepping down by
 * `DENSITY_STEP`) whose measured height fits `targetPx`. Returns the floor if
 * nothing fits, so the content flows onto a second page rather than being
 * compressed past readability. Bounded loop — always terminates.
 */
export async function fitDensity(
  measure: (density: number) => number | Promise<number>,
  targetPx: number = TARGET_HEIGHT_PX,
): Promise<FitResult> {
  const steps = Math.round((1 - DENSITY_FLOOR) / DENSITY_STEP);
  let result: FitResult = { density: 1, heightPx: 0, heightMm: 0, fits: false };
  for (let i = 0; i <= steps; i++) {
    const density = Math.max(DENSITY_FLOOR, Number((1 - i * DENSITY_STEP).toFixed(4)));
    const heightPx = await measure(density);
    result = { density, heightPx, heightMm: heightPx / PX_PER_MM, fits: heightPx <= targetPx };
    if (result.fits) break;
  }
  return result;
}

/**
 * Measures the résumé as it would print, independent of the on-screen
 * viewport, and returns the fitted density.
 *
 * The live `.resume-doc` can't be measured in place: on screen it's governed
 * by `resumeCSS`'s `@media screen` rules, including a `max-width: 640px`
 * breakpoint that switches to a single-column layout — and `@media` tests the
 * viewport, not the element, so even a fixed-width clone flips layout in a
 * narrow window. Instead the résumé is rebuilt inside an off-screen
 * same-origin iframe wide enough (900px) that the mobile breakpoint never
 * matches there, with `.resume-doc` pinned to the 182mm print content width
 * and the screen sheet's padding/border removed. Inter is loaded inside the
 * iframe before measuring so the metrics match the printed font.
 */
export async function fitResumeInBrowser(
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
      return { density: 1, heightPx: 0, heightMm: 0, fits: true };
    }
    const style = doc.createElement("style");
    style.textContent =
      `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;` +
      `src:url("${fontUrl}") format("woff2")}html,body{margin:0;padding:0}${css}`;
    doc.head.appendChild(style);

    const container = doc.createElement("div");
    container.className = "resume-doc";
    container.innerHTML = bodyHtml;
    doc.body.appendChild(container);

    await Promise.all([doc.fonts.load('400 11px "Inter"'), doc.fonts.load('700 11px "Inter"')]);
    await doc.fonts.ready;

    return await fitDensity((density) => {
      container.setAttribute(
        "style",
        `--density:${density};width:${CONTENT_WIDTH_MM}mm;max-width:${CONTENT_WIDTH_MM}mm;` +
          "margin:0;padding:0;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;",
      );
      return container.getBoundingClientRect().height;
    });
  } finally {
    iframe.remove();
  }
}
