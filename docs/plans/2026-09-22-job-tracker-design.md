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
| Tailor résumé, rewrite bullets | **Tailored Résumé** | already shipped |
| Cover letter | Cover Letter | deferred |
| Interview questions, STAR answers | Interview Prep | deferred |
| Role-fit matrix, recruiter verdict | Recruiter Review | deferred |

Nine buttons would be interface noise for five outputs.

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
