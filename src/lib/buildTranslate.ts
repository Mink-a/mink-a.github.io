import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CollectionEntry } from "astro:content";
import { languageName, sha256Hex, translateItems, type TranslateEnv } from "./translate";
import { postUrl } from "./postMarkdown";

// Resolve against the build's working dir (repo root) — import.meta.url points
// into Vite's bundled output at build time and wouldn't find these.
const CACHE_PATH = join(process.cwd(), "src/data/translations.json");
const DEV_VARS_PATH = join(process.cwd(), ".dev.vars");

// Committed hash-cache so deploys don't re-translate unchanged posts.

interface CacheEntry {
  hash: string;
  en: string;
}

function readCache(): Record<string, CacheEntry> {
  try {
    if (existsSync(CACHE_PATH)) return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    /* corrupt → start fresh */
  }
  return {};
}
const cache = readCache();

function writeCache(): void {
  try {
    writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
  } catch {
    /* read-only FS → keep this build's translations in memory only */
  }
}

// Build credentials: process env first (CI), then .dev.vars for local builds.
function readEnv(): TranslateEnv {
  const env: TranslateEnv = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    LLM_MODEL: process.env.LLM_MODEL,
  };
  if (env.LLM_API_KEY) return env;
  try {
    const devVars = DEV_VARS_PATH;
    if (existsSync(devVars)) {
      for (const line of readFileSync(devVars, "utf8").split("\n")) {
        const m = line.match(/^\s*(LLM_API_KEY|LLM_BASE_URL|LLM_MODEL)\s*=\s*(.*?)\s*$/);
        if (m) env[m[1] as keyof TranslateEnv] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* ignore */
  }
  return env;
}
const env = readEnv();

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

async function translate(post: CollectionEntry<"writing">): Promise<string> {
  const segs = splitMarkdown(post.body ?? "");
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

  return `# ${enTitle}\n\n${meta}\n\n${enBody}\n`;
}

const inflight = new Map<string, Promise<string | null>>();

/**
 * Build-time English doc for a non-English post, or `null` when none is
 * available. Returns the cached output when the content is unchanged; on a miss,
 * translates and updates the committed cache if an LLM key is present (build
 * only). In dev (or without a key) it serves the cache and never calls the model.
 * Memoized so it runs at most once per post per build — both the post page (to
 * decide the toolbar button) and the .en.md endpoint (for content) call it.
 */
export async function getEnglishDoc(post: CollectionEntry<"writing">): Promise<string | null> {
  if (post.data.lang === "en") return null;

  const slug = post.id;
  const existing = inflight.get(slug);
  if (existing) return existing;

  const task = (async (): Promise<string | null> => {
    const hash = await sha256Hex(
      `${post.data.title}\u0000${post.data.description}\u0000${post.body ?? ""}`,
    );
    const hit = cache[slug];
    if (hit && hit.hash === hash) return hit.en;
    if (!import.meta.env.PROD || !env.LLM_API_KEY) return hit?.en ?? null;
    try {
      const en = await translate(post);
      cache[slug] = { hash, en };
      writeCache();
      return en;
    } catch (err) {
      console.error(`translate "${slug}" failed:`, err);
      return hit?.en ?? null;
    }
  })();
  inflight.set(slug, task);
  return task;
}
