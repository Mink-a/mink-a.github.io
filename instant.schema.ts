import { i } from "@instantdb/core";

/**
 * InstantDB schema for the portfolio assistant.
 *
 * - `sessions`  — one per visitor (entity id IS the client's visitorId UUID),
 *                 holding client-reported context plus server-derived geo.
 * - `messages`  — every user/assistant turn, tied to a session by the
 *                 denormalized `sessionId` field (no relational link, so the
 *                 admin panel works without a strict schema push).
 *
 * Writes happen exclusively from the server via the Admin SDK; the client
 * never writes (see instant.perms.ts). Reads (admin panel) query by primary
 * `id` / fetch-and-join client-side, so they never depend on a custom index.
 */
const _schema = i.schema({
  entities: {
    sessions: i.entity({
      visitorId: i.string().indexed(), // mirror of the entity id, for convenience
      timezone: i.string(), // IANA tz, e.g. "Asia/Bangkok"
      locale: i.string(), // navigator.language
      userAgent: i.string(),
      browser: i.string().optional(),
      os: i.string().optional(),
      device: i.string().optional(),
      screen: i.string().optional(), // "1920x1080"
      referrer: i.string().optional(),
      country: i.string().optional(), // from Cloudflare edge geo
      city: i.string().optional(),
      startedAt: i.date().indexed(),
      lastSeenAt: i.date().indexed(),
    }),
    messages: i.entity({
      sessionId: i.string().indexed(), // = the owning session's id (visitorId)
      role: i.string(), // "user" | "assistant"
      content: i.string(),
      model: i.string().optional(),
      inputTokens: i.number().optional(),
      outputTokens: i.number().optional(),
      createdAt: i.date().indexed(),
    }),
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
