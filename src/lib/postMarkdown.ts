import type { CollectionEntry } from "astro:content";

/** Canonical origin — kept in sync with `site` in astro.config.mjs. */
const SITE = "https://minkhantkyaw.com";

/** Public, human-facing URL of a post. */
export function postUrl(post: CollectionEntry<"writing">): string {
  return `${SITE}/writing/${post.id}/`;
}

/** Relative URL of the plain-Markdown version served by `[...slug].md.ts`. */
export function postMarkdownUrl(post: CollectionEntry<"writing">): string {
  return `/writing/${post.id}.md`;
}

/** True for posts whose source language isn't English. */
export function isTranslatable(post: CollectionEntry<"writing">): boolean {
  return post.data.lang !== "en";
}

/**
 * Relative URL of the cached English Markdown served by
 * `api/writing/[...slug].en.md.ts` (under /api/* so the Worker actually runs —
 * the prerendered /writing/* tree is excluded from the Worker).
 * Only meaningful for non-English posts (English posts ARE this already).
 */
export function postEnglishMarkdownUrl(post: CollectionEntry<"writing">): string {
  return `/api/writing/${post.id}.en.md`;
}

/**
 * The post rendered as a self-contained Markdown document: a heading, a short
 * metadata block, and the raw body. Used by the `.md` endpoint and the
 * toolbar's "Copy page" button so LLMs (and humans) get clean source.
 */
export function postToMarkdown(post: CollectionEntry<"writing">): string {
  const { title, description, pubDate, tags } = post.data;
  const meta = [
    `> ${description}`,
    "",
    `Published: ${pubDate.toISOString().slice(0, 10)}`,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
    `Source: ${postUrl(post)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return `# ${title}\n\n${meta}\n\n${post.body ?? ""}\n`;
}

/**
 * Prompt seeded into AI assistants from the toolbar. For non-English posts it
 * points at the cached English Markdown so the model gets clean English source;
 * otherwise at the post itself.
 */
export function llmPrompt(post: CollectionEntry<"writing">): string {
  const url = isTranslatable(post) ? `${SITE}${postEnglishMarkdownUrl(post)}` : postUrl(post);
  return `Read this article and help me understand it, then answer my follow-up questions:\n${url}`;
}
