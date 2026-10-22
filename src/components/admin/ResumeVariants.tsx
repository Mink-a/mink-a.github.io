import { useLayoutEffect, useRef, useState } from "react";
import { renderResumeBody, resumeCSS } from "../../data/resume";
import { resumeVariants, type ResumeVariantSlug } from "../../data/resumeVariants";
import { fitResumeDocument } from "../../lib/resumeFit";

/**
 * Admin-only preview of the focused résumé variants (src/data/resumeVariants.ts).
 * Each variant renders as the same A4 sheet as the public /resume, filled to
 * the page by the same fitter, and "Download PDF" prints just that sheet via
 * the browser's own dialog (a real, searchable PDF). Variants are edited in
 * code, never here.
 */
export default function ResumeVariants() {
  const [slug, setSlug] = useState<ResumeVariantSlug>("fullstack");
  const variant = resumeVariants.find((v) => v.slug === slug) ?? resumeVariants[0];
  const sheetRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState("");

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    // Written here, not via dangerouslySetInnerHTML: React would re-apply that
    // markup on the next render and wipe the fitter's per-column overrides.
    sheet.innerHTML = renderResumeBody(variant.data);
    let live = true;
    setFill("");
    void fitResumeDocument(new URL("/fonts/inter-variable.woff2", location.href).href, sheet).then(
      (fit) => {
        if (!live || !fit) return;
        setFill(fit.fits ? "Fits one page" : "Overflows one page at the tightest spacing");
      },
    );
    return () => {
      live = false;
    };
  }, [variant]);

  const download = () => {
    // The browser names the saved PDF after the document title.
    const title = document.title;
    document.title = variant.fileName;
    window.print();
    document.title = title;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col print:block">
      <style id="resume-css">{resumeCSS}</style>
      {/* The admin is dark (`color-scheme: dark`), which Chromium also uses to
          paint the printed page margins — force a white, light page. */}
      <style>{`@media print { html, body { color-scheme: light !important; background: #fff !important; min-height: 0 !important; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-2 print:hidden">
        <nav aria-label="Résumé variants" className="flex gap-1">
          {resumeVariants.map((v) => (
            <button
              key={v.slug}
              onClick={() => setSlug(v.slug)}
              aria-pressed={v.slug === slug}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                v.slug === slug ? "bg-surface-2 text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted" aria-live="polite">
            {fill}
          </span>
          <button
            onClick={download}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-bg hover:opacity-90"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-8 print:overflow-visible print:p-0">
        {/* Keyed so switching variants mounts a fresh sheet: a fit still
            running for the previous variant lands on the detached one. */}
        <div key={slug} ref={sheetRef} className="resume-doc" data-resume-doc />
      </div>
    </div>
  );
}
