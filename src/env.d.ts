/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

import type { Runtime } from "@astrojs/cloudflare";

interface Env {
  /** LLM API key (Sargalay / OpenAI-compatible gateway) — Cloudflare secret. */
  LLM_API_KEY: string;
  /** InstantDB admin token — Cloudflare secret (bypasses permissions). */
  INSTANT_APP_ADMIN_TOKEN: string;
  /** Model slug; defaults to google/gemini-3.1-flash-lite-preview. */
  LLM_MODEL?: string;
  /** OpenAI-compatible base URL; defaults to the Sargalay gateway. */
  LLM_BASE_URL?: string;
  /** KV namespace backing the chat rate limiter. */
  RATE_LIMIT: KVNamespace;
}

declare global {
  namespace App {
    interface Locals extends Runtime<Env> {}
  }

  interface ImportMetaEnv {
    /** Public InstantDB app id — inlined into the client bundle at build. */
    readonly PUBLIC_INSTANT_APP_ID: string;
  }
}

export {};
