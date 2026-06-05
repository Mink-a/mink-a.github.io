import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    companyUrl: z.string().url().optional(),
    start: z.string(),                               // "2023-06"
    end: z.union([z.string(), z.literal("Present")]),
    description: z.string(),
    order: z.number(),                               // higher = newer
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),                                // "SaaS Platform", "Web App"
    description: z.string(),
    tech: z.array(z.string()),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    /** Thumbnail / hero image. Local path under public/ or absolute URL. */
    image: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    /** BCP-47 base code of the post's source language (drives <html lang>, the
     *  language badge, and the reader-facing AI translation). */
    lang: z.string().default("en"),
    /** Open Graph / social-share image (1200×630). Public path like
     *  /assets/writing/foo.png or an absolute URL; falls back to /og.png. */
    cover: z.string().optional(),
  }),
});

export const collections = { experience, projects, writing };
