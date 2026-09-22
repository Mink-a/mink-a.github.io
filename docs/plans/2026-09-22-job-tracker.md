# Job Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the admin Résumé Studio into a job-application tracker with a computed fit score and an AI job-description analysis per application.

**Architecture:** InstantDB gains tracker fields on `applications` plus a `jdAnalyses` entity. Human-entered tracker data is written directly by the client under owner-only permissions; model output keeps going through the server so grounding runs before anything is persisted. The admin UI becomes a table of applications with a per-application artifact rail.

**Tech Stack:** Astro 5 (static) + React 19 islands, Cloudflare Pages Functions, InstantDB (`@instantdb/react` + `@instantdb/admin`), Vercel AI SDK against an OpenAI-compatible Gemini proxy, Zod, Tailwind v4, `bun test`.

**Design doc:** `docs/plans/2026-09-22-job-tracker-design.md`

---

## Conventions for every task

- No `any`. No `ReturnType<typeof …>` — name the type where it is owned.
- `bun run build` (= `astro check && astro build`) must end with **0 errors, 0 warnings, 0 hints** before any commit.
- Never force-push; `main` receives Pages CMS commits, so rebase.
- Run `bun install --frozen-lockfile` before trusting any local library behaviour: this repo ships no `node_modules` and bun otherwise resolves *above* the lockfile.

---

## Task 1: Schema and permissions

**Files:**
- Modify: `instant.schema.ts:45-61`
- Modify: `instant.perms.ts`

**Step 1: Add tracker fields and the new entity**

In `instant.schema.ts`, replace the `applications` entity and add `jdAnalyses`:

```ts
    applications: i.entity({
      company: i.string(),
      role: i.string(),
      // Optional so an application can be logged in seconds and tailored later.
      jobDescription: i.string().optional(),
      status: i.string().indexed(), // saved|applied|screening|interview|offer|rejected|ghosted
      url: i.string().optional(),
      appliedAt: i.date().optional().indexed(),
      nextAction: i.string().optional(),
      nextActionAt: i.date().optional().indexed(),
      createdAt: i.date().indexed(),
      updatedAt: i.date().indexed(),
    }),
    jdAnalyses: i.entity({
      applicationId: i.string().indexed(), // = the owning application's id
      content: i.string(), // JSON-serialized JdAnalysis
      coverage: i.number(), // 0–100, computed locally — never returned by the model
      model: i.string().optional(),
      inputTokens: i.number().optional(),
      outputTokens: i.number().optional(),
      createdAt: i.date().indexed(),
    }),
```

Update the file's header comment to describe `jdAnalyses` alongside the others.

**Step 2: Allow owner client writes on `applications` only**

`instant.perms.ts` currently denies all client writes. Add owner-scoped create/update/delete
for `applications`, keeping `jdAnalyses` and `resumeVersions` server-only. Follow the existing
rule syntax in that file; the owner test is the same email comparison already used for reads.

**Step 3: Push permissions — this is mandatory**

```bash
bunx instant-cli@latest push perms -y
```

Expected: `Permissions updated!`. **Without this the feature looks broken in a specific way:**
server writes succeed while `db.useQuery` returns empty, because the deployed
`$default: false` denies client reads of any new namespace. A schema push is *not*
required — the code deliberately avoids `where` on non-primary keys.

**Step 4: Verify**

```bash
bun run build
```
Expected: 0 errors.

**Step 5: Commit**

```bash
git add instant.schema.ts instant.perms.ts
git commit -m "feat(data): tracker fields and JD analyses"
```

---

## Task 2: The keyword matcher (test-first)

This is the only genuinely failure-prone logic in the feature: a matcher that silently
matches nothing yields a plausible-looking 0%, and one that matches too loosely yields a
plausible-looking 95%. Neither is visible on inspection.

**Files:**
- Create: `src/lib/jdAnalysis.ts`
- Create: `src/lib/jdAnalysis.test.ts`

**Step 1: Write the failing tests**

```ts
import { expect, test } from "bun:test";
import { matchesResume, computeCoverage, groundAnalysis } from "./jdAnalysis";

test("matches a plain keyword", () => {
  expect(matchesResume("TypeScript", "Built APIs in TypeScript")).toBe(true);
});

test("does not match a keyword that is only a substring of another word", () => {
  expect(matchesResume("Go", "Worked with Django and Mongo")).toBe(false);
});

test("matches across punctuation boundaries", () => {
  expect(matchesResume("React", "Shipped React.js interfaces")).toBe(true);
  expect(matchesResume("CI/CD", "Owned CI/CD pipelines")).toBe(true);
});

test("preserves symbol-bearing tokens", () => {
  expect(matchesResume("C#", "Wrote C# services")).toBe(true);
  expect(matchesResume("C#", "Wrote C services")).toBe(false);
});

test("matches a multi-word keyword only when contiguous", () => {
  expect(matchesResume("system design", "Led system design reviews")).toBe(true);
  expect(matchesResume("system design", "Systems used a design doc")).toBe(false);
});

test("coverage counts critical and important only", () => {
  const got = computeCoverage([
    { keyword: "a", importance: "critical", present: true },
    { keyword: "b", importance: "important", present: false },
    { keyword: "c", importance: "nice", present: false },
  ]);
  expect(got).toBe(50);
});

test("grounding drops keywords absent from the job description", () => {
  const res = groundAnalysis(
    {
      summary: "s",
      mustHaves: [
        { keyword: "Kubernetes", importance: "critical" },
        { keyword: "TypeScript", importance: "critical" },
      ],
      responsibilities: ["r"],
      standouts: ["s"],
    },
    "We need a TypeScript engineer.",
    "I write TypeScript.",
  );
  if (!res.ok) throw new Error(res.error);
  expect(res.value.mustHaves.map((m) => m.keyword)).toEqual(["TypeScript"]);
  expect(res.value.coverage).toBe(100);
});

test("grounding rejects an analysis with no surviving keywords", () => {
  const res = groundAnalysis(
    {
      summary: "s",
      mustHaves: [{ keyword: "Kubernetes", importance: "critical" }],
      responsibilities: ["r"],
      standouts: ["s"],
    },
    "We need a TypeScript engineer.",
    "I write TypeScript.",
  );
  expect(res.ok).toBe(false);
});
```

**Step 2: Run to verify it fails**

```bash
bun test src/lib/jdAnalysis.test.ts
```
Expected: FAIL — module not found.

**Step 3: Implement**

`src/lib/jdAnalysis.ts`:

```ts
// Grounding layer for job-description analysis.
//
// The model extracts requirements from the JD; it never scores the candidate.
// Every keyword it returns is verified against the JD, and presence against the
// résumé is decided here, so the fit score is arithmetic rather than flattery.

import { z } from "zod";
import { renderResumeMarkdown } from "../data/resume";

export const MAX_JD_CHARS = 20_000;

export const importanceSchema = z.enum(["critical", "important", "nice"]);
export type Importance = z.infer<typeof importanceSchema>;

export const analysisSchema = z.object({
  summary: z.string().min(1),
  mustHaves: z
    .array(z.object({ keyword: z.string().min(1), importance: importanceSchema }))
    .min(1),
  responsibilities: z.array(z.string().min(1)).min(1),
  standouts: z.array(z.string().min(1)).min(1),
});

export type AnalysisOutput = z.infer<typeof analysisSchema>;

export interface ScoredKeyword {
  keyword: string;
  importance: Importance;
  present: boolean;
}

export interface JdAnalysis {
  summary: string;
  mustHaves: ScoredKeyword[];
  responsibilities: string[];
  standouts: string[];
  coverage: number;
}

export type GroundResult =
  | { ok: true; value: JdAnalysis }
  | { ok: false; error: string };

/**
 * Splits text into comparable tokens. Punctuation becomes a boundary so
 * "React.js" yields ["react", "js"], while `+` and `#` survive so "C++" and
 * "C#" stay distinct from "C".
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

/** True when the keyword's tokens occur contiguously in the text. */
export function matchesResume(keyword: string, text: string): boolean {
  const needle = tokenize(keyword);
  if (needle.length === 0) return false;
  const hay = tokenize(text);
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let hit = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

/** Percentage of critical and important requirements present in the résumé. */
export function computeCoverage(scored: ScoredKeyword[]): number {
  const counted = scored.filter((s) => s.importance !== "nice");
  if (counted.length === 0) return 0;
  const present = counted.filter((s) => s.present).length;
  return Math.round((present / counted.length) * 100);
}

/**
 * Enforces that every extracted keyword really came from the job description,
 * then scores presence against the résumé.
 */
export function groundAnalysis(
  out: AnalysisOutput,
  jobDescription: string,
  resumeText: string = renderResumeMarkdown(),
): GroundResult {
  const seen = new Set<string>();
  const mustHaves: ScoredKeyword[] = [];

  for (const m of out.mustHaves) {
    const key = m.keyword.trim().toLowerCase();
    if (key.length === 0 || seen.has(key)) continue;
    // The model's job is to summarize its input, so anything it "extracted"
    // that is not in the input was invented.
    if (!matchesResume(m.keyword, jobDescription)) continue;
    seen.add(key);
    mustHaves.push({
      keyword: m.keyword.trim(),
      importance: m.importance,
      present: matchesResume(m.keyword, resumeText),
    });
  }

  if (mustHaves.length === 0) {
    return { ok: false, error: "No extracted requirement could be found in the job description." };
  }

  return {
    ok: true,
    value: {
      summary: out.summary,
      mustHaves,
      responsibilities: out.responsibilities,
      standouts: out.standouts,
      coverage: computeCoverage(mustHaves),
    },
  };
}

export const ANALYSIS_SYSTEM = `You analyse a job description for a software engineer.

Extract only what the job description actually says. Do not infer requirements it
does not state, and do not assess the candidate — you are not given their résumé.

- "mustHaves": concrete requirements named in the posting. Use the posting's own
  wording for each keyword, as short as possible (a technology, tool, or named
  skill). Mark "critical" if the posting calls it required, "important" if it is
  clearly expected, "nice" if it is listed as a bonus.
- "responsibilities": what the person will actually do, in the posting's terms.
- "standouts": what the posting says distinguishes a strong candidate.
- "summary": the hiring intent behind the role, in two or three sentences.`;

export function buildAnalysisPrompt(input: { company: string; role: string; jobDescription: string }): string {
  return [
    `Company: ${input.company}`,
    `Role: ${input.role}`,
    "",
    "Job description:",
    input.jobDescription.slice(0, MAX_JD_CHARS),
  ].join("\n");
}
```

**Step 4: Run tests**

```bash
bun test src/lib/jdAnalysis.test.ts
```
Expected: 8 pass.

**Step 5: Sanity-check the matcher against the real résumé**

A matcher that passes unit tests can still be inert on real data. Run once:

```bash
bun -e 'import {matchesResume} from "./src/lib/jdAnalysis"; import {renderResumeMarkdown} from "./src/data/resume"; const r=renderResumeMarkdown(); for (const k of ["TypeScript","React","Cloudflare","Kubernetes","Rust","system design"]) console.log(k, matchesResume(k, r));'
```
Expected: the technologies actually in `src/data/resume.ts` print `true`, and
`Kubernetes`/`Rust` print `false`. If everything prints `true` or everything prints
`false`, the matcher is broken regardless of the unit tests.

**Step 6: Commit**

```bash
git add src/lib/jdAnalysis.ts src/lib/jdAnalysis.test.ts
git commit -m "feat(lib): grounded JD analysis with computed fit coverage"
```

---

## Task 3: The analysis endpoint

**Files:**
- Create: `src/pages/api/jd-analysis.ts`
- Reference: `src/pages/api/resume-tailor.ts` (copy its structure), `src/lib/adminAuth.ts`

**Step 1: Implement**

Mirror `resume-tailor.ts` exactly — same owner auth via `adminAuth.ts`, same
`createOpenAICompatible({ …, supportsStructuredOutputs: true })` provider, same
`generateText` + `Output.object({ schema: analysisSchema })` call. Do **not** use
`generateObject`: it is deprecated in `ai@6`, and the proxy rejects structured output
without `supportsStructuredOutputs`.

Behaviour:

- `POST { applicationId }` — loads the application with the Admin SDK, 400s if its
  `jobDescription` is empty (applications may now be logged without one), generates,
  grounds via `groundAnalysis`, and on `ok: false` returns 422 with the reason and
  **persists nothing**.
- On success, writes one `jdAnalyses` row with `content` (JSON), `coverage`, `model`
  and token counts.

**Step 2: Guard the tailor endpoint for JD-less applications**

`src/pages/api/resume-tailor.ts` must also 400 when `jobDescription` is absent, since
the field is now optional. Clean cutover: application *creation* moves to the client,
so remove the create path from this endpoint and require an existing `applicationId`.

**Step 3: Verify**

```bash
bun run build
```
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/pages/api/jd-analysis.ts src/pages/api/resume-tailor.ts
git commit -m "feat(api): job-description analysis endpoint"
```

---

## Task 4: Tracker table

**Files:**
- Create: `src/components/admin/JobTracker.tsx`
- Modify: `src/components/admin/AdminApp.tsx` (tab label `Résumé` → `Jobs`, render `JobTracker`)
- Create: `src/components/admin/status.ts` (the `Status` union, labels, chip classes)

**Step 1: Build the layout from the approved mockup**

Stat bar (counts for Applied / Screening / Interview / Offer, plus `+ New application`),
then `grid grid-cols-[minmax(0,1fr)_380px]`: table on the left, artifact rail on the right.

Columns: Role + Company, Status, Fit, Applied, Next action.

Use only existing tokens — `bg-surface`, `bg-surface-2`, `border-border`, `text-text`,
`text-text-muted`, `text-text-dim`, `bg-accent`, `text-bg`, `bg-accent-soft`.

**Step 2: Read with the existing client-side join pattern**

```ts
const { isLoading, error, data } = db.useQuery({
  applications: {}, resumeVersions: {}, jdAnalyses: {},
});
```

Group by the denormalized FK client-side, exactly as `ResumeStudio.tsx:48-51` does today,
so no pushed index is required. Fit comes from the newest `jdAnalyses` row's `coverage`.

**Step 3: Handle the pre-existing row**

The one real application in the database predates `status` and has none. Read it as
`app.status ?? "saved"` rather than writing a migration — it is a single row the owner
can reclassify in one click.

**Step 4: Write tracker edits from the client**

Status, `appliedAt`, `url`, `nextAction`, `nextActionAt` use `db.transact` directly.
Always bump `updatedAt`. Setting status to `applied` defaults `appliedAt` to now when
it is empty.

**Step 5: Verify in a browser**

```bash
bun run dev --port 4331
```
Log in as owner, confirm: rows render, a status change persists across reload, and
a new application can be created with no job description.

**Step 6: Commit**

```bash
git add src/components/admin/JobTracker.tsx src/components/admin/status.ts src/components/admin/AdminApp.tsx
git commit -m "feat(admin): job application tracker"
```

---

## Task 5: Artifact views

**Files:**
- Create: `src/components/admin/ArtifactRail.tsx`, `src/components/admin/JdAnalysisView.tsx`
- Modify: `src/components/admin/ResumeStudio.tsx` → becomes the résumé artifact view
- Delete: the application-list and version-list columns from `ResumeStudio.tsx` (now the tracker's job)

**Step 1: Rail**

Two rows for now — `JD Analysis` and `Résumé` — each showing a filled dot when the
artifact exists and a muted one when it does not. Selecting one replaces the table
with the artifact, full width.

**Step 2: JD Analysis view**

Coverage bar, then must-haves grouped by importance with present/missing marks —
missing critical items are the actionable output, so they sort first. Then
responsibilities and standouts. Include the four states from the mockup: not
generated (with a Generate button), generating, grounding-rejected (422 reason,
nothing saved), and loaded.

**Step 3: Résumé view**

Keep the existing preview, `Download PDF`, `Copy as Markdown` and version list —
strip only the outer application/version columns. The PDF path is untouched.

**Step 4: Verify**

```bash
bun run build
```
Expected: 0 errors. Then a browser pass: generate an analysis against a real pasted
JD, confirm the Fit column updates, and confirm a missing critical keyword is listed.

**Step 5: Commit**

```bash
git add src/components/admin
git commit -m "feat(admin): JD analysis and résumé artifact views"
```

---

## Task 6: End-to-end verification

**Step 1: Full build**

```bash
bun install --frozen-lockfile && bun run build && bun test
```
Expected: 0 errors, all tests pass.

**Step 2: Local runtime pass**

Run under `wrangler pages dev` (not `astro dev`) so the API routes execute with real
bindings. Exercise: create application without JD → add JD → analyse → check coverage
→ tailor résumé → download PDF → delete.

**Step 3: Confirm zero residue**

Delete every test application created during verification and re-query. The owner's
real application (**Software Engineer III — FMX / Fanatics**) and its version must
still be present — do not delete it.

**Step 4: Deploy and verify in production**

Push, watch the Pages deploy, then re-probe. New API routes can 404 transiently for a
minute from edge propagation lag; re-probe before concluding anything is broken.

---

## Out of scope

Cover Letter, Interview Prep and Recruiter Review — deferred by decision, with their
prose-grounding approach already settled in the design doc.

## Known blocker, unrelated to this plan

Three commits (`84000cd`, `389ce77`, `c17591c`) implementing server-side PDF download
are built and unpushed. They need `CLOUDFLARE_BROWSER_TOKEN` set as a Pages secret;
the current OAuth token cannot mint one (`code 9109`). Deploying them without the
secret would return 503 on download and remove the working Print button. Resolve that
before or alongside shipping this feature, not silently.
