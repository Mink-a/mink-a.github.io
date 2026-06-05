import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const DEFAULT_BASE_URL = "https://api.sargalay.com/v1";
export const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";

// Each LLM call covers up to this many characters of source fragments.
// Smaller batches keep the model from miscounting array elements; residual
// mismatches are repaired by splitting (see translateItems).
const CHUNK_CHARS = 3_500;
const MAX_CHUNK_ITEMS = 20;
const MAX_OUTPUT_TOKENS = 4_000;

export interface TranslateEnv {
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
}

/** English display name of a BCP-47 base code, e.g. "my" → "Burmese". */
export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Tolerantly pull a JSON string array out of a model response. */
export function parseStringArray(text: string): string[] | null {
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

function chunk(items: string[]): string[][] {
  const chunks: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  for (const s of items) {
    if (cur.length > 0 && (len + s.length > CHUNK_CHARS || cur.length >= MAX_CHUNK_ITEMS)) {
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

function systemPrompt(targetName: string, kind: "html" | "markdown"): string {
  const surface = kind === "html" ? "HTML" : "Markdown";
  const preserve =
    kind === "html"
      ? "every HTML tag, attribute, and entity"
      : "all Markdown structure (headings, lists, emphasis, links, blockquotes)";
  return `You are a professional translation engine. Translate the human-readable text of each ${surface} fragment into ${targetName}.
Rules:
- Output ONLY a JSON array of strings: same length and order as the input array. No commentary, no markdown fences.
- Preserve ${preserve} exactly.
- Never translate or alter code: <code> elements, fenced \`\`\` blocks, inline backticks, URLs, file paths, commands, environment variables, flags, or identifiers.
- Keep product, technology, and brand names in their original form.
- Translate fluently and naturally; never add or drop information.`;
}

/**
 * Translate an array of fragments into `target`, preserving markup/code. Splits
 * into character-bounded batches run concurrently. Models occasionally return
 * the wrong number of array elements, so a mismatched batch is split in half and
 * retried down to single items — guaranteeing the output length matches the
 * input (a stubborn single item degrades to its original text).
 */
export async function translateItems(opts: {
  env: TranslateEnv;
  items: string[];
  target: string;
  kind?: "html" | "markdown";
  signal?: AbortSignal;
}): Promise<string[]> {
  const { env, items, target, kind = "html", signal } = opts;
  const targetName = languageName(target);
  const system = systemPrompt(targetName, kind);
  const model = createOpenAICompatible({
    name: "sargalay",
    baseURL: env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey: env.LLM_API_KEY ?? "",
  }).chatModel(env.LLM_MODEL ?? DEFAULT_MODEL);

  const translateGroup = async (group: string[], depth: number): Promise<string[]> => {
    const { text } = await generateText({
      model,
      system,
      prompt: `Translate each fragment of this JSON array into ${targetName}. Return the translated array only:\n${JSON.stringify(group)}`,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: signal,
    });
    const arr = parseStringArray(text);
    if (arr && arr.length === group.length) return arr;
    if (group.length > 1 && depth < 6) {
      const mid = Math.ceil(group.length / 2);
      const [a, b] = await Promise.all([
        translateGroup(group.slice(0, mid), depth + 1),
        translateGroup(group.slice(mid), depth + 1),
      ]);
      return [...a, ...b];
    }
    return [arr?.[0] ?? group[0]]; // single item, still wrong → keep original
  };

  const results = await Promise.all(chunk(items).map((group) => translateGroup(group, 0)));
  return results.flat();
}
