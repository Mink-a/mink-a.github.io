import type { InstantRules } from "@instantdb/core";

/**
 * Lock everything down:
 *  - All writes are denied for clients. The chat endpoint writes via the Admin
 *    SDK, which bypasses these rules entirely.
 *  - Only the owner (authenticated by magic code to OWNER_EMAIL) can read the
 *    session/message logs, which powers the admin panel.
 *
 * `auth.email` is the email of the currently signed-in InstantDB user.
 */
const OWNER_EMAIL = "hello@minkhantkyaw.com";
const isOwner = `auth.email == '${OWNER_EMAIL}'`;

const rules = {
  $default: {
    allow: { $default: "false" },
  },
  sessions: {
    allow: {
      view: "isOwner",
      create: "false",
      update: "false",
      delete: "false",
    },
    bind: { isOwner },
  },
  messages: {
    allow: {
      view: "isOwner",
      create: "false",
      update: "false",
      delete: "false",
    },
    bind: { isOwner },
  },
} satisfies InstantRules;

export default rules;
