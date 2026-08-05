// Grounding layer for AI résumé tailoring.
//
// The model is only ever allowed to re-emphasize what already exists in
// src/data/resume.ts. Prompting alone cannot guarantee that, so everything it
// returns is validated and normalized here before it is persisted or rendered.

import { z } from "zod";
import { resume, type Project, type ResumeData } from "../data/resume";

export const MAX_JD_CHARS = 20_000;

/** Raw structured output requested from the model. */
export const tailoredSchema = z.object({
  subtitle: z.string().min(1),
  experience: z
    .array(
      z.object({
        role: z.string(),
        company: z.string(),
        date: z.string(),
        bullets: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
  skills: z.array(z.object({ label: z.string(), items: z.string().min(1) })).min(1),
  projects: z.array(z.object({ name: z.string(), desc: z.string().min(1) })).min(1),
  notes: z.string().min(1),
});

export type TailoredOutput = z.infer<typeof tailoredSchema>;

/** The validated override persisted per version (notes are stored separately). */
export interface TailoredResume {
  subtitle: string;
  experience: { role: string; company: string; date: string; bullets: string[] }[];
  skills: { label: string; items: string }[];
  projects: Project[];
}

const roleKey = (e: { company: string; role: string; date: string }) =>
  `${e.company}|${e.role}|${e.date}`;

/** Outcome of grounding: either a validated override, or why it was rejected. */
export type GroundResult =
  | { ok: true; value: TailoredResume }
  | { ok: false; error: string };

/**
 * Enforces that the model only reordered and rewrote existing material.
 *
 * - Experience: the full set of roles must come back, matched exactly, and is
 *   re-sorted into base (reverse-chronological) order. The model reorders
 *   employers if left unchecked, which misrepresents the work history.
 * - Skills: may be narrowed and reordered by label, but the item list of each
 *   group is taken verbatim from the base résumé — the model otherwise edits it
 *   silently, dropping or adding technologies.
 * - Projects: may be narrowed and reordered; names must exist in the base and
 *   links are re-attached from it, so tailoring can't drop or forge a URL.
 */
export function groundTailored(out: TailoredOutput): GroundResult {
  const baseOrder = new Map(resume.experience.map((e, i) => [roleKey(e), i]));

  const unknownRoles = out.experience.filter((e) => !baseOrder.has(roleKey(e)));
  if (unknownRoles.length > 0) {
    return {
      ok: false,
      error: `Unknown or altered experience entries (company/role/date must match the résumé verbatim): ${unknownRoles
        .map((e) => roleKey(e))
        .join("; ")}`,
    };
  }

  const returned = new Set(out.experience.map(roleKey));
  const missing = resume.experience.filter((e) => !returned.has(roleKey(e)));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Every experience entry must be present. Missing: ${missing
        .map((e) => roleKey(e))
        .join("; ")}`,
    };
  }
  if (returned.size !== out.experience.length) {
    return { ok: false, error: "Duplicate experience entries returned." };
  }

  const baseSkills = new Map(resume.skills.map((s) => [s.label, s.items]));
  const unknownSkills = out.skills.filter((s) => !baseSkills.has(s.label));
  if (unknownSkills.length > 0) {
    return {
      ok: false,
      error: `Unknown skill groups (labels must match the résumé): ${unknownSkills
        .map((s) => s.label)
        .join(", ")}`,
    };
  }
  if (new Set(out.skills.map((s) => s.label)).size !== out.skills.length) {
    return { ok: false, error: "Duplicate skill groups returned." };
  }

  const baseProjects = new Map(resume.projects.map((p) => [p.name, p]));
  const unknownProjects = out.projects.filter((p) => !baseProjects.has(p.name));
  if (unknownProjects.length > 0) {
    return {
      ok: false,
      error: `Unknown projects (names must match the résumé): ${unknownProjects
        .map((p) => p.name)
        .join(", ")}`,
    };
  }
  if (new Set(out.projects.map((p) => p.name)).size !== out.projects.length) {
    return { ok: false, error: "Duplicate projects returned." };
  }

  return {
    ok: true,
    value: {
      subtitle: out.subtitle,
      // Restore reverse-chronological order regardless of what came back.
      experience: [...out.experience].sort(
        (a, b) => baseOrder.get(roleKey(a))! - baseOrder.get(roleKey(b))!,
      ),
      // Skills are factual inventory, so only the SELECTION and ORDER come from
      // the model — the item list itself is taken verbatim from the résumé.
      // Otherwise the model quietly edits it (dropping or adding technologies).
      skills: out.skills.map((s) => ({ label: s.label, items: baseSkills.get(s.label)! })),
      projects: out.projects.map((p) => {
        const link = baseProjects.get(p.name)?.link;
        return link ? { name: p.name, desc: p.desc, link } : { name: p.name, desc: p.desc };
      }),
    },
  };
}

/** Merges a tailored override onto the base résumé for rendering. */
export function toResumeData(tailored: TailoredResume): ResumeData {
  return { ...resume, ...tailored };
}

export const TAILOR_SYSTEM = `You tailor an existing software-engineering résumé to a specific job description.

Hard rules — violating any of these makes the output unusable:
- Use ONLY facts present in the résumé below. Never invent employers, roles, dates, projects, skills, metrics, or technologies.
- Reproduce every company, role, and date string EXACTLY as given, character for character.
- Return every experience entry, in the same reverse-chronological order given.
- Skill group labels and project names must be copied verbatim from the résumé.

What you SHOULD do:
- Rewrite the subtitle to position the candidate for this specific role.
- Rewrite, reorder, and drop bullets WITHIN each role so the most relevant work leads. Keep at least one bullet per role. Keep bullets concrete and factual.
- Reorder skill groups so the most relevant come first, and drop groups irrelevant to the role. Copy each group's "items" string verbatim — it is replaced with the résumé's own text, so editing it has no effect.
- Select the most relevant projects and drop the rest. You may rewrite a project description to emphasize relevance.
- In "notes", briefly explain what you emphasized and why, in two or three sentences.`;

function baseResumeFacts(): string {
  const experience = resume.experience
    .map(
      (e) =>
        `- role: ${e.role}\n  company: ${e.company}\n  date: ${e.date}\n  bullets:\n${e.bullets
          .map((b) => `    - ${b}`)
          .join("\n")}`,
    )
    .join("\n");
  const skills = resume.skills.map((s) => `- ${s.label}: ${s.items}`).join("\n");
  const projects = resume.projects.map((p) => `- ${p.name}: ${p.desc}`).join("\n");

  return `CURRENT SUBTITLE:\n${resume.subtitle}\n\nEXPERIENCE (reproduce role/company/date verbatim, keep this order):\n${experience}\n\nSKILL GROUPS (labels verbatim):\n${skills}\n\nPROJECTS (names verbatim):\n${projects}`;
}

export function buildTailorPrompt(input: {
  company: string;
  role: string;
  jobDescription: string;
  priorError?: string;
}): string {
  const retry = input.priorError
    ? `\n\nYour previous attempt was rejected: ${input.priorError}\nFix this exactly and return valid output.`
    : "";

  return `=== RÉSUMÉ ===\n${baseResumeFacts()}\n\n=== TARGET ROLE ===\nCompany: ${input.company}\nRole: ${input.role}\n\n=== JOB DESCRIPTION ===\n${input.jobDescription}${retry}`;
}
