import type { APIRoute } from "astro";
import { Output, generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { init as initAdmin, id } from "@instantdb/admin";
import { z } from "zod";
import {
  MAX_JD_CHARS,
  TAILOR_SYSTEM,
  buildTailorPrompt,
  groundTailored,
  tailoredSchema,
  type GroundResult,
} from "../../lib/resumeTailor";

export const prerender = false;

const DEFAULT_BASE_URL = "https://api.sargalay.com/v1";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";
const MAX_OUTPUT_TOKENS = 4000;
const OWNER_EMAIL = "hello@minkhantkyaw.com";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate"),
    token: z.string().min(1),
    applicationId: z.string().min(1).optional(),
    company: z.string().min(1).max(200),
    role: z.string().min(1).max(200),
    jobDescription: z.string().min(1).max(MAX_JD_CHARS),
  }),
  z.object({
    action: z.literal("delete"),
    token: z.string().min(1),
    applicationId: z.string().min(1),
  }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * The slice of the Admin SDK the owner check needs. Structural, so it stays
 * decoupled from the SDK's internal client type.
 */
interface TokenVerifier {
  auth: {
    verifyToken: (token: string) => Promise<{ email?: string | null } | null | undefined>;
  };
}

/**
 * Verifies the caller is the site owner. The client sends its InstantDB
 * refresh token; the email is resolved server-side and never trusted from the
 * request body. `User.email` is optional in the SDK types, so a record without
 * an email must be rejected rather than compared loosely.
 */
async function isOwner(db: TokenVerifier, token: string): Promise<boolean> {
  try {
    const user = await db.auth.verifyToken(token);
    return Boolean(user && user.email && user.email === OWNER_EMAIL);
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const appId = import.meta.env.PUBLIC_INSTANT_APP_ID;

  if (!appId || !env.INSTANT_APP_ADMIN_TOKEN) {
    return json({ error: "Résumé studio is not configured." }, 503);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid request." }, 400);
  }
  const body = parsed.data;

  // No schema passed on purpose: keeps the Admin SDK in attribute auto-create
  // mode, so this works without a prior `instant-cli push`.
  const db = initAdmin({ appId, adminToken: env.INSTANT_APP_ADMIN_TOKEN });

  if (!(await isOwner(db, body.token))) {
    return json({ error: "Not authorized." }, 401);
  }

  if (body.action === "delete") {
    // Filtered client-side rather than with a `where`, so the query never
    // depends on a pushed index (same reasoning as the chat logger).
    const { resumeVersions } = await db.query({ resumeVersions: {} });
    const doomed = (resumeVersions ?? []).filter(
      (v) => v.applicationId === body.applicationId,
    );
    await db.transact([
      ...doomed.map((v) => db.tx.resumeVersions[v.id].delete()),
      db.tx.applications[body.applicationId].delete(),
    ]);
    return json({ ok: true });
  }

  if (!env.LLM_API_KEY) {
    return json({ error: "Résumé studio is not configured." }, 503);
  }

  const modelId = env.LLM_MODEL ?? DEFAULT_MODEL;
  const model = createOpenAICompatible({
    name: "sargalay",
    baseURL: env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey: env.LLM_API_KEY,
    // Required: without it this endpoint rejects the JSON response format.
    supportsStructuredOutputs: true,
  }).chatModel(modelId);

  const { company, role, jobDescription } = body;
  let priorError: string | undefined;
  let grounded: GroundResult | undefined;
  let notes = "";
  let usage: { inputTokens?: number; outputTokens?: number } = {};

  // One retry, feeding the validation failure back to the model.
  for (let attempt = 0; attempt < 2; attempt++) {
    let object;
    try {
      const result = await generateText({
        model,
        output: Output.object({ schema: tailoredSchema }),
        system: TAILOR_SYSTEM,
        prompt: buildTailorPrompt({ company, role, jobDescription, priorError }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: request.signal,
      });
      object = result.output;
      usage = { inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens };
    } catch (err) {
      console.error("resume tailor generation failed:", err);
      return json({ error: "The model failed to produce a tailored résumé." }, 502);
    }

    grounded = groundTailored(object);
    if (grounded.ok) {
      notes = object.notes;
      break;
    }
    priorError = grounded.error;
  }

  if (!grounded?.ok) {
    return json(
      { error: `Rejected ungrounded output: ${priorError ?? "unknown validation failure"}` },
      502,
    );
  }

  const now = Date.now();
  const applicationId = body.applicationId ?? id();

  const { resumeVersions } = await db.query({ resumeVersions: {} });
  const nextVersion =
    (resumeVersions ?? [])
      .filter((v) => v.applicationId === applicationId)
      .reduce((max: number, v) => Math.max(max, Number(v.version ?? 0)), 0) + 1;

  await db.transact([
    db.tx.applications[applicationId].update({
      company,
      role,
      jobDescription,
      ...(body.applicationId ? {} : { createdAt: now }),
      updatedAt: now,
    }),
    db.tx.resumeVersions[id()].update({
      applicationId,
      version: nextVersion,
      content: JSON.stringify(grounded.value),
      notes,
      model: modelId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      createdAt: now,
    }),
  ]);

  return json({ ok: true, applicationId, version: nextVersion });
};
