// Renders the résumé (src/data/resume.ts) to public/Min-Khant-Kyaw-Resume.pdf.
// Single source of truth: the same data + styles power the /resume page.
// Run after editing the résumé: `bun run resume:pdf`
// (One-time browser setup if needed: `bunx puppeteer browsers install chrome`)
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeFile, unlink } from "node:fs/promises";
import puppeteer from "puppeteer";
import { resumeCSS, renderResumeBody } from "../src/data/resume.ts";

const root = process.cwd();
const pdfPath = path.join(root, "public", "Min-Khant-Kyaw-Resume.pdf");
const tmpPath = path.join(os.tmpdir(), `resume-${Date.now()}.html`);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>html,body{margin:0;padding:0}${resumeCSS}</style>
  </head>
  <body><div class="resume-doc">${renderResumeBody()}</div></body>
</html>`;

await writeFile(tmpPath, html, "utf-8");

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(tmpPath).href, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    preferCSSPageSize: true,
    printBackground: true,
  });
  console.log(`Wrote ${path.relative(root, pdfPath)}`);
} finally {
  await browser.close();
  await unlink(tmpPath).catch(() => {});
}
