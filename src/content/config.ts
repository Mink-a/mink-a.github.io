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
    tech: z.array(z.string()),
    order: z.number(),                               // higher = newer
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    type: z.string(),                                // "SaaS Platform", "Web App"
    description: z.string(),
    tech: z.array(z.string()),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { experience, projects, blog };
