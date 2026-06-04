import type { APIRoute } from "astro";
import type { ModelMessage } from "ai";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { init as initAdmin, id } from "@instantdb/admin";
import { z } from "zod";
import { buildChatContext } from "../../lib/portfolio-context";

export const prerender = false;

const DEFAULT_BASE_URL = "https://api.sargalay.com/v1";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";

const MAX_OUTPUT_TOKENS = 700;
const MAX_MESSAGES = 16;
// Must comfortably exceed a full assistant reply (MAX_OUTPUT_TOKENS ≈ ~3k chars),
// since prior replies are echoed back as history on the next turn.
const MAX_CONTENT_CHARS = 8000;

// Fixed-window per-IP guard. KV is eventually consistent across edge regions,
// so treat this as abuse mitigation, not a precise quota.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_S = 60 * 60;

const bodySchema = z.object({
  visitorId: z.uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_CONTENT_CHARS),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
  client: z
    .object({
      timezone: z.string().max(100).optional(),
      locale: z.string().max(40).optional(),
      screen: z.string().max(40).optional(),
      referrer: z.string().max(500).optional(),
    })
    .optional(),
});

const SYSTEM_PREAMBLE = `You are the friendly personal assistant on Min Khant Kyaw's portfolio website. Help visitors learn about Min — his background, experience, projects, skills, and writing — using ONLY the knowledge base below.

Guidelines:
- Be concise, warm, and concrete; prefer short paragraphs.
- Answer in plain prose. Do not use markdown tables or headings.
- Reply in the same language the user writes in.
- Only state facts present in the knowledge base. If you don't know, say so and suggest contacting Min.
- If asked something outside Min's professional/portfolio scope, politely decline and steer back to his work.
- For hiring, collaboration, or contact, point people to hello@minkhantkyaw.com.
- Refer to Min in the third person.`;

function formatNow(timeZone?: string): string {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "short" };
  try {
    return `${new Intl.DateTimeFormat("en-US", { ...opts, timeZone }).format(new Date())} (${timeZone ?? "UTC"})`;
  } catch {
    return `${new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(new Date())} (UTC)`;
  }
}

function parseUserAgent(ua: string): { browser?: string; os?: string; device?: string } {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : undefined;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /(iPhone|iPad|iPod)/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : undefined;
  const device = /Mobi|Android|iPhone|iPad|iPod/.test(ua) ? "Mobile" : "Desktop";
  return { browser, os, device };
}

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const key = `chat-rl:${ip}`;
  const now = Date.now();
  const raw = await kv.get(key);

  let count = 0;
  let resetAt = now + RATE_LIMIT_WINDOW_S * 1000;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; resetAt: number };
      if (parsed.resetAt > now) {
        count = parsed.count;
        resetAt = parsed.resetAt;
      }
    } catch {
      // Corrupt entry — start a fresh window.
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

interface LogTurnInput {
  appId: string;
  adminToken: string;
  visitorId: string;
  userText: string;
  userAt: number;
  assistantText: string;
  assistantAt: number;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  context: {
    userAgent: string;
    timezone?: string;
    locale?: string;
    screen?: string;
    referrer?: string;
    country?: string;
    city?: string;
  };
}

async function logTurn(input: LogTurnInput): Promise<void> {
  // No schema passed on purpose: that keeps the Admin SDK in attribute
  // auto-create mode, so logging works without a prior `instant-cli push`.
  const db = initAdmin({ appId: input.appId, adminToken: input.adminToken });

  // The session entity id IS the visitor's UUID, so we look it up by primary
  // key (always indexed) — no dependency on a pushed/typed schema or a link.
  const sessionId = input.visitorId;
  const { sessions } = await db.query({
    sessions: { $: { where: { id: sessionId } } },
  });
  const exists = sessions.length > 0;

  const sessionTx = exists
    ? db.tx.sessions[sessionId].update({ lastSeenAt: input.assistantAt })
    : db.tx.sessions[sessionId].update({
        visitorId: input.visitorId,
        timezone: input.context.timezone ?? "unknown",
        locale: input.context.locale ?? "unknown",
        userAgent: input.context.userAgent,
        ...parseUserAgent(input.context.userAgent),
        screen: input.context.screen,
        referrer: input.context.referrer,
        country: input.context.country,
        city: input.context.city,
        startedAt: input.userAt,
        lastSeenAt: input.assistantAt,
      });

  await db.transact([
    sessionTx,
    db.tx.messages[id()].update({
      sessionId,
      role: "user",
      content: input.userText,
      createdAt: input.userAt,
    }),
    db.tx.messages[id()].update({
      sessionId,
      role: "assistant",
      content: input.assistantText,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      createdAt: input.assistantAt,
    }),
  ]);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  if (!env.LLM_API_KEY) {
    return new Response("Chat is not configured.", { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response("Invalid request.", { status: 400 });
  }
  const { visitorId, messages, client } = parsed.data;

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const rate = await checkRateLimit(env.RATE_LIMIT, ip);
  if (!rate.ok) {
    return new Response("Too many requests. Please slow down.", {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfter ?? RATE_LIMIT_WINDOW_S) },
    });
  }

  // Static prefix (preamble + knowledge base) stays identical for cache hits;
  // the volatile date/time is appended last.
  const system = `${SYSTEM_PREAMBLE}\n\n=== KNOWLEDGE BASE ===\n${await buildChatContext()}\n\n=== CURRENT DATE & TIME ===\n${formatNow(client?.timezone)}\nUse this for any time-relative question (e.g., "today", or how recent something is).`;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  const modelId = env.LLM_MODEL ?? DEFAULT_MODEL;
  const model = createOpenAICompatible({
    name: "sargalay",
    baseURL: env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey: env.LLM_API_KEY,
  }).chatModel(modelId);
  const userAt = Date.now();
  const appId = import.meta.env.PUBLIC_INSTANT_APP_ID;
  const canLog = Boolean(appId && env.INSTANT_APP_ADMIN_TOKEN && lastUser);

  const result = streamText({
    model,
    system,
    messages: messages as ModelMessage[],
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: request.signal,
    onFinish: ({ text, usage }) => {
      if (!canLog || !lastUser) return;
      locals.runtime.ctx.waitUntil(
        logTurn({
          appId,
          adminToken: env.INSTANT_APP_ADMIN_TOKEN,
          visitorId,
          userText: lastUser.content,
          userAt,
          assistantText: text,
          assistantAt: Date.now(),
          model: modelId,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          context: {
            userAgent: request.headers.get("user-agent") ?? "unknown",
            timezone: client?.timezone,
            locale: client?.locale,
            screen: client?.screen,
            referrer: client?.referrer,
            country: locals.runtime.cf?.country,
            city: locals.runtime.cf?.city,
          },
        }).catch((err) => console.error("chat log failed:", err)),
      );
    },
  });

  return result.toTextStreamResponse();
};
