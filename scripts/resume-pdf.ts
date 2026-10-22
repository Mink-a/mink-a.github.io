// Renders the résumé (src/data/resume.ts) to public/Min-Khant-Kyaw-Resume.pdf,
// a single full A4 page. The same data + styles power /resume, and the page
// fill is the very same `fitResumeDocument` /resume runs live
// (src/lib/resumeFit.ts), executed in the headless page here before printing.
// Run after editing the résumé: `bun run resume:pdf`
// (One-time browser setup if needed: `bunx puppeteer browsers install chrome`)
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, unlink } from "node:fs/promises";
import puppeteer from "puppeteer";
import ts from "typescript";
import { resumeCSS, renderResumeBody } from "../src/data/resume.ts";
import { FILL_HEIGHT_MM, type FitResult } from "../src/lib/resumeFit.ts";

const root = process.cwd();
const fontUrl = pathToFileURL(path.join(root, "public", "fonts", "inter-variable.woff2")).href;

// resumeFit.ts has no imports, so transpiling it alone yields a self-contained
// browser module. Inlined into the page, its top-level `fitResumeDocument` is
// in scope for the call appended after it.
const fitModule = ts.transpileModule(
  await readFile(path.join(root, "src", "lib", "resumeFit.ts"), "utf-8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;

const targets = [{ file: "Min-Khant-Kyaw-Resume.pdf", body: renderResumeBody() }];

const htmlFor = (body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;src:url("${fontUrl}") format("woff2")}</style>
    <style>html,body{margin:0;padding:0}</style>
    <style id="resume-css">${resumeCSS}</style>
  </head>
  <body>
    <div class="resume-doc" data-resume-doc>${body}</div>
    <script type="module">
${fitModule}
const html = document.documentElement;
try {
  html.dataset.fit = JSON.stringify(await fitResumeDocument(${JSON.stringify(fontUrl)}) ?? null);
} catch (err) {
  html.dataset.fitError = String(err);
}
    </script>
  </body>
</html>`;

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();

  for (const target of targets) {
    const tmpPath = path.join(os.tmpdir(), `resume-${Date.now()}-${target.file}.html`);
    await writeFile(tmpPath, htmlFor(target.body), "utf-8");
    try {
      await page.goto(pathToFileURL(tmpPath).href, { waitUntil: "networkidle0" });
      await page.waitForSelector("html[data-fit], html[data-fit-error]", { timeout: 30_000 });
      const { fitJson, fitError } = await page.$eval("html", (el) => ({
        fitJson: el.dataset.fit,
        fitError: el.dataset.fitError,
      }));
      const fit: FitResult | null = fitJson ? JSON.parse(fitJson) : null;
      if (!fit) throw new Error(`Fitting ${target.file} failed: ${fitError ?? "no résumé found"}`);

      const pdfPath = path.join(root, "public", target.file);
      const pdf = await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
      const pages = (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
      const balanced = fit.balanced
        ? `, ${fit.balanced.column} balanced at ${fit.balanced.density}`
        : "";
      console.log(
        `Wrote ${path.relative(root, pdfPath)} — density ${fit.density}${balanced}, height ` +
          `${fit.heightMm.toFixed(1)}mm = ${((fit.heightMm / FILL_HEIGHT_MM) * 100).toFixed(1)}% ` +
          `of the fill height, ${pages} page${pages === 1 ? "" : "s"}` +
          (fit.fits ? "" : " — DOES NOT FIT at density floor"),
      );
      if (pages !== 1) process.exitCode = 1;
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }
} finally {
  await browser.close();
}
