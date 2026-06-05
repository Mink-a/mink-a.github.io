import type { APIRoute } from "astro";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

export const prerender = false;

const DEFAULT_BASE_URL = "https://api.sargalay.com/v1";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";

// Translation is pricier than chat, so allow fewer per window.
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_S = 60 * 60;

const MAX_SEGMENTS = 600;
const MAX_TOTAL_CHARS = 80_000;
const MAX_SEGMENT_CHARS = 5_000;
// Each LLM call covers up to this many characters of source fragments.
const CHUNK_CHARS = 5_000;
const MAX_OUTPUT_TOKENS = 4_000;
// Translation cache lives a week; keyed by target + content hash.
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

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Tolerantly pull a JSON string array out of a model response. */
function parseStringArray(text: string): string[] | null {
  let t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) t = fence[1].trim();
  if (!t.startsWith("[")) {
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    if (a !== -1 && b > a) t = t.slice(a, b + 1);
  }
  try {
    const v = JSON.parse(t);
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  } catch {
    /* fall through */
  }
  return null;
}

/** Split fragments into chunks bounded by character count. */
function chunk(segments: string[]): string[][] {
  const chunks: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  for (const s of segments) {
    if (cur.length > 0 && len + s.length > CHUNK_CHARS) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(s);
    len += s.length;
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
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

  const targetName = languageName(target);
  const model = createOpenAICompatible({
    name: "sargalay",
    baseURL: env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey: env.LLM_API_KEY,
  }).chatModel(env.LLM_MODEL ?? DEFAULT_MODEL);

  const system = `You are a professional translation engine. Translate the human-readable text in each HTML fragment into ${targetName}.
Rules:
- Output ONLY a JSON array of strings: same length and order as the input array. No commentary, no markdown fences.
- Preserve every HTML tag, attribute, and entity exactly as given.
- Never translate or alter the contents of <code> elements, URLs, file paths, commands, environment variables, flags, or code identifiers.
- Keep product, technology, and brand names in their original form.
- Translate fluently and naturally; never add or drop information.`;

  try {
    const results = await Promise.all(
      chunk(segments).map(async (group) => {
        const { text } = await generateText({
          model,
          system,
          prompt: `Translate each fragment of this JSON array into ${targetName}. Return the translated array only:\n${JSON.stringify(group)}`,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          abortSignal: request.signal,
        });
        const arr = parseStringArray(text);
        if (!arr || arr.length !== group.length) {
          throw new Error(`chunk mismatch: got ${arr?.length}, expected ${group.length}`);
        }
        return arr;
      }),
    );

    const translations = results.flat();
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
