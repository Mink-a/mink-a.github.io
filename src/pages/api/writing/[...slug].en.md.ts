import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { postToMarkdown, postUrl } from "../../../lib/postMarkdown";
import { languageName, sha256Hex, translateItems } from "../../../lib/translate";

// Runtime: translate once on first request, then serve from KV. (A static route
// can't run at request time, and CI has no LLM key — so this is on-demand.)
// Lives under /api/* because the Cloudflare adapter excludes the prerendered
// /writing/* tree from the Worker, which would shadow a /writing/<slug>.en.md.
export const prerender = false;

const CACHE_TTL_S = 60 * 60 * 24 * 7;

function md(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Ordered prose/code segments; fenced code (incl. blockquoted) is never translated. */
function splitMarkdown(source: string): { text: string; code: boolean }[] {
  const lines = source.split("\n");
  const segs: { text: string; code: boolean }[] = [];
  let buf: string[] = [];
  let inCode = false;
  let fence = "";
  const flush = (code: boolean) => {
    if (buf.length > 0) segs.push({ text: buf.join("\n"), code });
    buf = [];
  };
  for (const line of lines) {
    const open = line.match(/^[\s>]*(`{3,}|~{3,})/);
    if (!inCode && open) {
      flush(false);
      inCode = true;
      fence = open[1];
      buf.push(line);
    } else if (inCode && new RegExp(`^[\\s>]*${fence[0]}{${fence.length},}\\s*$`).test(line)) {
      buf.push(line);
      flush(true);
      inCode = false;
      fence = "";
    } else {
      buf.push(line);
    }
  }
  flush(inCode);
  return segs;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug;
  const post = (await getCollection("writing", (p) => !p.data.draft)).find((p) => p.id === slug);
  if (!post) return new Response("Not found", { status: 404 });

  const env = locals.runtime.env;

  // English posts already are this; without a key, fall back to the original.
  if (post.data.lang === "en" || !env.LLM_API_KEY) {
    return md(postToMarkdown(post));
  }

  const body = post.body ?? "";
  const cacheKey = `tr-md:en:${await sha256Hex(
    `${post.data.title}\u0000${post.data.description}\u0000${body}`,
  )}`;
  const cached = await env.RATE_LIMIT.get(cacheKey);
  if (cached) return md(cached);

  try {
    const segs = splitMarkdown(body);
    const prose = segs.filter((s) => !s.code && s.text.trim().length > 0).map((s) => s.text);
    const out = await translateItems({
      env,
      items: [post.data.title, post.data.description, ...prose],
      target: "en",
      kind: "markdown",
    });

    const enTitle = out[0];
    const enDesc = out[1];
    let i = 2;
    const enBody = segs
      .map((s) => (s.code || s.text.trim().length === 0 ? s.text : out[i++]))
      .join("\n");

    const meta = [
      `> ${enDesc}`,
      "",
      `Published: ${post.data.pubDate.toISOString().slice(0, 10)}`,
      post.data.tags.length > 0 ? `Tags: ${post.data.tags.join(", ")}` : null,
      `Source: ${postUrl(post)}`,
      `Translated to English from ${languageName(post.data.lang)} by AI.`,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");

    const doc = `# ${enTitle}\n\n${meta}\n\n${enBody}\n`;
    locals.runtime.ctx.waitUntil(
      env.RATE_LIMIT.put(cacheKey, doc, { expirationTtl: CACHE_TTL_S }).catch(() => {}),
    );
    return md(doc);
  } catch (err) {
    console.error("en.md translate failed:", err);
    return md(postToMarkdown(post)); // graceful: original beats a hard failure
  }
};
