import type { APIRoute } from "astro";
import { z } from "zod";
import { sha256Hex, translateItems } from "../../lib/translate";

export const prerender = false;

// Translation is pricier than chat, so allow fewer per window.
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_S = 60 * 60;

const MAX_SEGMENTS = 600;
const MAX_TOTAL_CHARS = 80_000;
const MAX_SEGMENT_CHARS = 5_000;
const CACHE_TTL_S = 60 * 60 * 24 * 7;

const bodySchema = z.object({
  target: z.string().min(2).max(20),
  source: z.string().max(20).optional(),
  segments: z.array(z.string().min(1).max(MAX_SEGMENT_CHARS)).min(1).max(MAX_SEGMENTS),
});

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const key = `tr-rl:${ip}`;
  const now = Date.now();
  let count = 0;
  let resetAt = now + RATE_LIMIT_WINDOW_S * 1000;
  const raw = await kv.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; resetAt: number };
      if (parsed.resetAt > now) {
        count = parsed.count;
        resetAt = parsed.resetAt;
      }
    } catch {
      /* corrupt entry → fresh window */
    }
  }
  if (count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((resetAt - now) / 1000) };
  }
  await kv.put(key, JSON.stringify({ count: count + 1, resetAt }), {
    expirationTtl: Math.max(60, Math.ceil((resetAt - now) / 1000)),
  });
  return { ok: true };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  if (!env.LLM_API_KEY) {
    return new Response("Translation is not configured.", { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response("Invalid request.", { status: 400 });
  }
  const { target, segments } = parsed.data;

  if (segments.reduce((n, s) => n + s.length, 0) > MAX_TOTAL_CHARS) {
    return new Response("Content too large to translate.", { status: 413 });
  }

  const cacheKey = `tr:${target}:${await sha256Hex(segments.join("\u0000"))}`;
  const cached = await env.RATE_LIMIT.get(cacheKey);
  if (cached) {
    return Response.json({ translations: JSON.parse(cached) }, { headers: { "X-Cache": "HIT" } });
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const rate = await checkRateLimit(env.RATE_LIMIT, ip);
  if (!rate.ok) {
    return new Response("Too many translations. Please try again later.", {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfter ?? RATE_LIMIT_WINDOW_S) },
    });
  }

  try {
    const translations = await translateItems({
      env,
      items: segments,
      target,
      kind: "html",
      signal: request.signal,
    });
    locals.runtime.ctx.waitUntil(
      env.RATE_LIMIT.put(cacheKey, JSON.stringify(translations), {
        expirationTtl: CACHE_TTL_S,
      }).catch(() => {}),
    );
    return Response.json({ translations });
  } catch (err) {
    console.error("translate failed:", err);
    return new Response("Translation failed. Please try again.", { status: 502 });
  }
};
