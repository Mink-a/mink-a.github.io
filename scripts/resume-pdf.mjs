// Renders public/resume.html to public/Min-Khant-Kyaw-Resume.pdf with headless Chromium.
// Run after editing the resume: `bun run resume:pdf`
// (One-time browser setup if needed: `bunx puppeteer browsers install chrome`)
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const root = process.cwd();
const htmlPath = path.join(root, "public", "resume.html");
const pdfPath = path.join(root, "public", "Min-Khant-Kyaw-Resume.pdf");

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    preferCSSPageSize: true,
    printBackground: true,
  });
  console.log(`Wrote ${path.relative(root, pdfPath)}`);
} finally {
  await browser.close();
}
