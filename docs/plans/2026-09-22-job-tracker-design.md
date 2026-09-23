# Job Tracker — Design

**Status:** approved 2026-09-22
**Supersedes nothing.** Extends the Résumé Studio shipped in `fb5879a` / `8172092`.

## Problem

The admin can tailor a résumé to a pasted job description, but there is nowhere to
record that an application happened. At any real application volume the unanswered
question is not "what does this résumé look like" — it is *"which of these needs
something from me today?"* Tailoring without tracking produces good artifacts and no
follow-through.

## Scope

v1 ships the tracking layer plus one AI artifact: **JD Analysis**. Cover Letter,
Interview Prep and Recruiter Review are deliberately deferred — the artifact
plumbing is proven once, then reused.

## The nine prompts, deduplicated

The reference material listed nine prompts. They collapse to five artifacts:

| Source prompts | Artifact | v1 |
| --- | --- | --- |
| JD breakdown, ATS alignment | **JD Analysis** | yes |
| *(none — added by the owner)* | **Skill Gap Interview** | yes |
| Tailor résumé, rewrite bullets | **Tailored Résumé** | already shipped |
| Cover letter | Cover Letter | deferred |
| Interview questions, STAR answers | Interview Prep | deferred |
| Role-fit matrix, recruiter verdict | Recruiter Review | deferred |

Nine buttons would be interface noise for five outputs. The Skill Gap Interview is
not from that list: it closes the loop the nine prompts leave open, where the JD
demands something the résumé does not contain.

## Layout

**Variant B — tracker table with an artifact rail.** Chosen over a pipeline board
(no room for dates or next actions, degrades past ~30 cards) and over extending
today's three-column studio (no tracking surface at all).

```
┌──────────────────────────────────────────────────────────────┐
│ 12 Applied   3 Screening   1 Interview   0 Offer   [+ New]   │  stat bar
├───────────────────────────────────────┬──────────────────────┤
│ Role / Company │ Status │ Fit │ Applied │ Next action │      │
│ ───────────────────────────────────── │  selected app        │
│ …rows…                                │  ○ JD Analysis       │  artifact rail
│                                       │  ○ Résumé            │
└───────────────────────────────────────┴──────────────────────┘
```

Selecting an artifact opens it full-width, replacing the table. The funnel keeps
the pipeline board's only real advantage at a fraction of its cost.

## Write-path rule

Today every write goes through the server via the Admin SDK. That is correct for
model output and wrong for a status dropdown, which should feel instant.

The rule from here:

> **Human-entered data is written by the client under owner-only permissions.
> Model-generated data is written by the server, after grounding.**

Tracker fields (status, dates, URL, next action) are client writes — InstantDB is
built for this and it removes a round trip per keystroke. Every AI artifact stays
server-side, because that is where the API key and the grounding checks live.

## Data model

`applications` gains tracker fields, and `jobDescription` becomes optional so an
application can be logged in seconds and tailored later:

```ts
applications: i.entity({
  company: i.string(),
  role: i.string(),
  jobDescription: i.string().optional(),   // was required
  status: i.string().indexed(),            // saved|applied|screening|interview|offer|rejected|ghosted
  url: i.string().optional(),
  appliedAt: i.date().optional().indexed(),
  nextAction: i.string().optional(),
  nextActionAt: i.date().optional().indexed(),
  createdAt: i.date().indexed(),
  updatedAt: i.date().indexed(),
})
```

New entity, following the `resumeVersions` shape (denormalized FK, JSON payload,
no relational link, so no schema push is required):

```ts
jdAnalyses: i.entity({
  applicationId: i.string().indexed(),
  content: i.string(),        // JSON-serialized JdAnalysis
  coverage: i.number(),       // 0–100, computed here, never by the model
  model: i.string().optional(),
  inputTokens: i.number().optional(),
  outputTokens: i.number().optional(),
  createdAt: i.date().indexed(),
})
```

`coverage` is denormalized onto the row so the table can render a Fit column for
120 applications without parsing 120 JSON blobs.

## Grounding

The résumé tailor taught the lesson the hard way: the model reordered employers and
silently edited a skills list despite being told not to. Prompting is not a control.
Two enforced checks apply here.

**1. Extracted keywords must actually occur in the job description.** The model's
job is to summarize its input, so every returned keyword is verified as a
case-insensitive substring of the submitted JD. Keywords that fail are dropped, not
trusted.

**2. The fit score is computed, never generated.** The model is not asked how good a
fit the candidate is — that number would be unfalsifiable flattery. It only extracts
requirements. Presence is then decided locally, by matching each keyword against the
rendered base résumé text:

```
coverage = present(critical ∪ important) / total(critical ∪ important) × 100
```

This makes the Fit column defensible: it is keyword coverage, and it can be traced
back to the exact keyword that is missing.

**Matcher risk.** A keyword matcher that silently matches nothing returns 0% and
looks plausible; one that matches too loosely returns 95% and also looks plausible.
Both are invisible on inspection, so the matcher gets unit tests against the real
résumé text, including the substring trap (`"Go"` must not match `"Django"`).

## Prose artifacts (deferred, decided now)

Cover Letter, Interview Prep and Recruiter Review emit prose, where structural
grounding does not apply and the model's failure mode is inventing metrics. The
control for those, when built:

- the prompt requires `[ADD METRIC]` in place of any figure it does not have, and
- generated prose is scanned for digit-patterns absent from the base résumé, which
  are surfaced as an "unverified claims" warning rather than silently shipped.

## Testing

The repo has no test framework. `bun test` is built in and needs no dependency, so
it is used for the pure functions only — keyword extraction grounding, the résumé
matcher, and coverage arithmetic. Everything else continues to be verified by
running it: `astro check` for types, and a real browser pass on the admin UI.

No tests are written for React rendering or InstantDB plumbing; they would assert
wiring rather than behaviour.

---

# Addendum — Skill Gap Interview

Approved 2026-09-22, after the tracker design.

## Problem

Grounding pins the résumé to `src/data/resume.ts`, which is exactly right for stopping
fabrication and exactly wrong as a ceiling: when a posting requires Kubernetes and the
résumé has never mentioned it, the correct answer is sometimes *"ask the owner — he may
well have done it"*, not *"omit it forever"*.

This is the **only sanctioned path for a new fact to enter the résumé**.

## The rule

> The model asks the question. The owner's typed answer is the fact.

The model may propose *what to ask about* — it derives that mechanically from keywords
already verified as present in the job description. It may never supply the answer.
Everything else keeps pinning against the base; the base simply grows by facts the owner
authored.

## Recording the "no" matters as much as the "yes"

A declined skill is persisted as a confirmed gap. Without it:

- every future Kubernetes posting re-asks the same question, forever, and
- the fit score cannot distinguish *"not yet asked"* from *"genuinely does not have it"*.

A confirmed gap is also a real finding in its own right: it tells the owner what to learn.

## Evidence, not checkboxes

Each confirmed skill captures `{ have, level, roleKey, evidence }`. Appending a bare
keyword to a skills list is résumé padding that fails at the first interview question.
The owner-typed `evidence` is what lets the tailor write a bullet that is both specific
and true, and `roleKey` is chosen from a dropdown of the résumé's actual roles, so it is
structured data rather than free text.

## Data model

```ts
skillFacts: i.entity({
  skill: i.string().indexed(),     // normalized match key, lowercase
  label: i.string(),               // display form, owner's capitalization
  have: i.boolean(),               // false = confirmed gap; never ask again
  level: i.string().optional(),    // learning | working | strong
  evidence: i.string().optional(), // owner-typed; the ONLY source of new fact text
  roleKey: i.string().optional(),  // "company|role|date" of a base role, or ""
  createdAt: i.date().indexed(),
  updatedAt: i.date().indexed(),
})
```

Owner-entered, therefore a client write, per the write-path rule above.

## One resolver, two consumers

`resolveSkillBase()` merges `src/data/resume.ts` with confirmed facts and becomes the
single input to both grounding and presence-matching. Consequences:

- `matchesResume` checks against the merged base, so **answering a gap must move the fit
  score**. That is the feature's falsifiable test: if the number does not move, it is
  broken.
- `groundTailored` pins against the merged base, so a newly confirmed skill is legal
  output while an invented one still is not.

## Experience bullets

The chosen scope lets evidence strengthen a bullet on the named role, which means the
model is editing work history. Two invariants contain that:

1. **Bullet budget.** A role's tailored bullet count may not exceed its base count plus
   the number of confirmed facts assigned to that role. Wholesale invention becomes
   arithmetically impossible.
2. **Metric scan.** Every number in the tailored output must occur in the base résumé or
   in some confirmed fact's evidence text. Anything else surfaces as an *unverified
   claim* warning before the résumé is used.

The prompt additionally requires `[ADD METRIC]` in place of any figure the model does not
have, so the scan should rarely have anything to catch.

## Keeping `/llms.txt` honest

Skills are declared twice today: `resume.ts` (`skills`) and `portfolio-context.ts`
(`techStack`). They already drift. Confirmed facts must reach both, but `output: 'static'`
means `/llms.txt` is generated at deploy time and cannot see runtime data — while
`/api/chat` shares `buildKnowledgeBase` and is already on-demand.

Resolution:

- `buildKnowledgeBase` accepts the merged skill set, so **the chat assistant is live and
  correct immediately**.
- `/llms.txt` opts into on-demand rendering (`export const prerender = false`) and
  **falls back to the static base if InstantDB is unreachable** — a crawler endpoint must
  not depend on a database being up.
- A **Copy résumé source** button emits updated TypeScript for both `resume.ts` and
  `portfolio-context.ts`, so the committed files converge on the owner's schedule without
  a GitHub token or code generation into tracked source.

The underlying duplication of the two skill lists is left alone here. It should be
collapsed into one declaration eventually; doing it inside this feature would widen the
change for no user-visible gain.
