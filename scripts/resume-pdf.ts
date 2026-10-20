// Renders the résumé (src/data/resume.ts) to static A4 PDFs in public/:
//   - Min-Khant-Kyaw-Resume.pdf      (canonical, linked from /resume)
//   - Min-Khant-Kyaw-<Variant>.pdf   (one per curated view, linked from /resume/<variant>)
// Single source of truth: the same data + styles power the /resume pages, and
// the same one-page density fit (src/lib/resumeFit.ts) as the browser.
// Run after editing the résumé: `bun run resume:pdf`
// (One-time browser setup if needed: `bunx puppeteer browsers install chrome`)
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeFile, unlink } from "node:fs/promises";
import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import { resumeCSS, renderResumeBody, resumeVariants } from "../src/data/resume.ts";
import {
  CONTENT_WIDTH_MM,
  PX_PER_MM,
  TARGET_HEIGHT_PX,
  fitDensity,
} from "../src/lib/resumeFit.ts";

const root = process.cwd();
const fontUrl = pathToFileURL(path.join(root, "public", "fonts", "inter-variable.woff2")).href;

const targets = [
  { file: "Min-Khant-Kyaw-Resume.pdf", body: renderResumeBody() },
  ...resumeVariants.map((v) => ({
    file: path.basename(v.pdf),
    body: renderResumeBody(v.slug),
  })),
];

const htmlFor = (body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;src:url("${fontUrl}") format("woff2")}</style>
    <style>html,body{margin:0;padding:0}${resumeCSS}</style>
  </head>
  <body><div class="resume-doc">${body}</div></body>
</html>`;

/** Height of `.resume-doc` at the 182mm print content width, under print media. */
const measure = (page: Page, density: number): Promise<number> =>
  page.evaluate(
    (d: number, widthMm: number) => {
      const el = document.querySelector<HTMLElement>(".resume-doc");
      if (!el) throw new Error(".resume-doc missing");
      el.style.setProperty("--density", String(d));
      el.style.width = `${widthMm}mm`;
      return el.getBoundingClientRect().height;
    },
    density,
    CONTENT_WIDTH_MM,
  );

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.emulateMediaType("print");
  await page.setViewport({ width: Math.ceil(CONTENT_WIDTH_MM * PX_PER_MM), height: 1200 });

  for (const target of targets) {
    const tmpPath = path.join(os.tmpdir(), `resume-${Date.now()}-${target.file}.html`);
    await writeFile(tmpPath, htmlFor(target.body), "utf-8");
    try {
      await page.goto(pathToFileURL(tmpPath).href, { waitUntil: "networkidle0" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      const fit = await fitDensity((d) => measure(page, d), TARGET_HEIGHT_PX);
      // Leave the fitted density applied, but release the measuring width so
      // the document flows into the @page content box.
      await page.evaluate(() => {
        document.querySelector<HTMLElement>(".resume-doc")?.style.removeProperty("width");
      });

      const pdfPath = path.join(root, "public", target.file);
      const pdf = await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
      const pages = (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
      console.log(
        `Wrote ${path.relative(root, pdfPath)} — height ${fit.heightMm.toFixed(1)}mm ` +
          `(target ${(TARGET_HEIGHT_PX / PX_PER_MM).toFixed(1)}mm), density ${fit.density}, ` +
          `${pages} page${pages === 1 ? "" : "s"}${fit.fits ? "" : " — DOES NOT FIT at density floor"}`,
      );
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }
} finally {
  await browser.close();
}
