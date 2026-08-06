// Server-side owner authentication for admin-only API routes.
//
// The client sends its InstantDB refresh token; the email is resolved here via
// the Admin SDK and never trusted from the request body.

export const OWNER_EMAIL = "hello@minkhantkyaw.com";

/**
 * The slice of the Admin SDK the owner check needs. Structural, so it stays
 * decoupled from the SDK's internal client type.
 */
export interface TokenVerifier {
  auth: {
    verifyToken: (token: string) => Promise<{ email?: string | null } | null | undefined>;
  };
}

/**
 * True only for the site owner. `User.email` is optional in the SDK types, so a
 * record without an email is rejected rather than compared loosely.
 */
export async function isOwner(db: TokenVerifier, token: string): Promise<boolean> {
  try {
    const user = await db.auth.verifyToken(token);
    return Boolean(user && user.email && user.email === OWNER_EMAIL);
  } catch {
    return false;
  }
}
