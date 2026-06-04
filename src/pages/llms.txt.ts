import type { APIContext } from "astro";
import { buildKnowledgeBase } from "../lib/portfolio-context";

export async function GET(context: APIContext) {
  const origin = (context.site ?? new URL("https://minkhantkyaw.com")).origin;
  const body = await buildKnowledgeBase(origin);

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
