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

/**
 * Relative URL of the build-time English Markdown served by `[...slug].en.md.ts`.
 * It's a real static file, so the prerendered /writing/* tree serves it directly.
 * Only exists for non-English posts that were translated at build.
 */
export function postEnglishMarkdownUrl(post: CollectionEntry<"writing">): string {
  return `/writing/${post.id}.en.md`;
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

/** Prompt seeded into AI assistants from the toolbar; points at the post. */
export function llmPrompt(post: CollectionEntry<"writing">): string {
  return `Read this article and help me understand it, then answer my follow-up questions:\n${postUrl(post)}`;
}
