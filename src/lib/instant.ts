import { init } from "@instantdb/react";
import schema from "../../instant.schema";

/**
 * Browser-side InstantDB client. Only bundled into the admin island
 * (client:only), so public visitors never download it.
 *
 * `appId` is public by design. When unset (env not yet filled) we fall back to
 * a placeholder so `init` doesn't throw; the admin UI gates on `isConfigured`.
 */
const APP_ID = import.meta.env.PUBLIC_INSTANT_APP_ID;

export const isConfigured = Boolean(APP_ID);

export const db = init({
  appId: APP_ID || "00000000-0000-0000-0000-000000000000",
  schema,
});
