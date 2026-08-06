import type { APIRoute } from "astro";
import { init as initAdmin } from "@instantdb/admin";
import { z } from "zod";
import { isOwner } from "../../lib/adminAuth";
import { renderResumeBody, resume, resumeCSS } from "../../data/resume";
import type { TailoredResume } from "../../lib/resumeTailor";

export const prerender = false;

const PDF_ENDPOINT = (accountId: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`;

const bodySchema = z.object({
  token: z.string().min(1),
  versionId: z.string().min(1),
});

// Loosely-typed Admin SDK rows (no schema passed), narrowed to what's read here.
interface VersionRow {
  id: string;
  applicationId?: string;
  version?: number;
  content?: string;
}
interface AppRow {
  id: string;
  company?: string;
  role?: string;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Inter as a base64 `@font-face`, fetched from this deployment's own static
 * assets. Cloudflare's render container has no Inter installed and silently
 * substitutes Roboto, which makes the PDF diverge from the public résumé;
 * inlining it also avoids depending on the font URL being publicly reachable.
 * Cached per isolate — the font never changes.
 */
let interFontCss: string | null = null;
async function getInterFontCss(requestUrl: string): Promise<string> {
  if (interFontCss) return interFontCss;
  const res = await fetch(new URL("/fonts/inter-variable.woff2", requestUrl));
  if (!res.ok) throw new Error(`Inter fetch failed: ${res.status}`);
  const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  interFontCss = `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  return interFontCss;
}

/** Safe for a Content-Disposition filename. */
const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const appId = import.meta.env.PUBLIC_INSTANT_APP_ID;

  if (!appId || !env.INSTANT_APP_ADMIN_TOKEN) {
    return json({ error: "Résumé studio is not configured." }, 503);
  }
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_BROWSER_TOKEN) {
    return json({ error: "PDF rendering is not configured." }, 503);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request." }, 400);

  const db = initAdmin({ appId, adminToken: env.INSTANT_APP_ADMIN_TOKEN });
  if (!(await isOwner(db, parsed.data.token))) {
    return json({ error: "Not authorized." }, 401);
  }

  // Primary-key lookups only, so nothing depends on a pushed index.
  const vq = await db.query({
    resumeVersions: { $: { where: { id: parsed.data.versionId } } },
  });
  const version = (vq.resumeVersions as unknown as VersionRow[])[0];
  if (!version?.content) return json({ error: "Version not found." }, 404);

  let tailored: TailoredResume;
  try {
    tailored = JSON.parse(version.content) as TailoredResume;
  } catch {
    return json({ error: "Stored version is corrupt." }, 500);
  }

  const aq = version.applicationId
    ? await db.query({ applications: { $: { where: { id: version.applicationId } } } })
    : { applications: [] };
  const application = (aq.applications as unknown as AppRow[])[0];

  let fontCss: string;
  try {
    fontCss = await getInterFontCss(request.url);
  } catch (err) {
    console.error("resume pdf font load failed:", err);
    return json({ error: "Could not load the résumé font." }, 502);
  }

  // Same shell as scripts/resume-pdf.ts, so output matches the canonical PDF.
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>${fontCss}</style>
    <style>html,body{margin:0;padding:0}${resumeCSS}</style>
  </head>
  <body><div class="resume-doc">${renderResumeBody({ ...resume, ...tailored })}</div></body>
</html>`;

  let pdf: ArrayBuffer;
  try {
    const res = await fetch(PDF_ENDPOINT(env.CLOUDFLARE_ACCOUNT_ID), {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.CLOUDFLARE_BROWSER_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        html,
        pdfOptions: { printBackground: true, preferCSSPageSize: true },
        gotoOptions: { waitUntil: "networkidle0" },
      }),
      signal: request.signal,
    });
    if (!res.ok) {
      console.error("browser rendering failed:", res.status, (await res.text()).slice(0, 400));
      // 429 = the account's daily browser-time budget is spent.
      return json(
        {
          error:
            res.status === 429
              ? "PDF rendering limit reached for today. Try again tomorrow."
              : "PDF rendering failed.",
        },
        502,
      );
    }
    pdf = await res.arrayBuffer();
  } catch (err) {
    console.error("browser rendering request failed:", err);
    return json({ error: "PDF rendering failed." }, 502);
  }

  const parts = [slug(resume.name), application?.company ? slug(application.company) : null]
    .filter(Boolean)
    .join("-");
  const filename = `${parts}-v${version.version ?? 1}.pdf`;

  return new Response(pdf, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
};
