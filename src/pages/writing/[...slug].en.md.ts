import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { getEnglishDoc } from "../../lib/buildTranslate";

// Prerender to static files (keeps build-only deps like node:fs out of the Worker).
export const prerender = true;

// Static: built once per deploy. Only non-English posts that have a translation
// (cached or generated this build) get a route; English posts don't need one.
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection(
    "writing",
    (p) => !p.data.draft && p.data.lang !== "en",
  );
  const paths = [];
  for (const post of posts) {
    const en = await getEnglishDoc(post);
    if (en) paths.push({ params: { slug: post.id }, props: { en } });
  }
  return paths;
};

export const GET: APIRoute = ({ props }) =>
  new Response((props as { en: string }).en, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
