import { useState } from "react";
import type { SyntheticEvent } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "../../../instant.schema";
import { db } from "../../lib/instant";
import { fmt } from "./shared";
import {
  renderResumeBody,
  renderResumeMarkdown,
  resume,
  resumeCSS,
  type ResumeData,
} from "../../data/resume";
// Type-only: keeps zod and the grounding logic out of the browser bundle.
import type { TailoredResume } from "../../lib/resumeTailor";

type Application = InstaQLEntity<AppSchema, "applications">;

const emptyForm = { company: "", role: "", jobDescription: "" };

/**
 * Hides the admin chrome when printing so only the résumé sheet reaches the
 * page. `visibility` (not `display`) keeps `.resume-doc` measurable, and the
 * absolute reset drops the offset inherited from the hidden layout.
 */
const PRINT_SCOPE_CSS = `@media print {
  body * { visibility: hidden !important; }
  .resume-doc, .resume-doc * { visibility: visible !important; }
  .resume-doc {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    padding: 0 !important;
  }
}`;

function parseTailored(content: string): TailoredResume | null {
  try {
    return JSON.parse(content) as TailoredResume;
  } catch {
    return null;
  }
}

export default function ResumeStudio() {
  const user = db.useUser();
  const { isLoading, error, data } = db.useQuery({ applications: {}, resumeVersions: {} });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const applications = [...(data?.applications ?? [])].sort(
    (a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0),
  );
  const selectedApp = applications.find((a) => a.id === selectedAppId) ?? null;

  // Grouped client-side so the query never depends on a pushed index.
  const versions = [...(data?.resumeVersions ?? [])]
    .filter((v) => v.applicationId === selectedApp?.id)
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? null;

  const tailored = selectedVersion ? parseTailored(selectedVersion.content) : null;
  const resumeData: ResumeData | null = tailored ? { ...resume, ...tailored } : null;

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/resume-tailor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, token: user.refresh_token }),
    });
    const out = (await res.json().catch(() => null)) as
      | { error?: string; applicationId?: string }
      | null;
    if (!res.ok) throw new Error(out?.error ?? `Request failed (${res.status})`);
    return out ?? {};
  };

  const openNew = () => {
    setSelectedAppId(null);
    setSelectedVersionId(null);
    setForm(emptyForm);
    setErr("");
    setFormOpen(true);
  };

  const openRegenerate = (app: Application) => {
    setForm({ company: app.company, role: app.role, jobDescription: app.jobDescription });
    setErr("");
    setFormOpen(true);
  };

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const out = await post({ action: "generate", applicationId: selectedApp?.id, ...form });
      if (out.applicationId) setSelectedAppId(out.applicationId);
      setSelectedVersionId(null); // fall through to the newest version
      setFormOpen(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (app: Application) => {
    if (!window.confirm(`Delete "${app.role} · ${app.company}" and all its versions?`)) return;
    setBusy(true);
    setErr("");
    try {
      await post({ action: "delete", applicationId: app.id });
      if (selectedAppId === app.id) {
        setSelectedAppId(null);
        setSelectedVersionId(null);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Prints the already-rendered preview. Cross-window printing (popup or
   * iframe) throws "Illegal invocation" in some Chromium builds, so instead the
   * page itself is printed with everything but `.resume-doc` hidden. resumeCSS
   * already scopes its sheet styling to `@media screen` and sets `@page`, so
   * print output matches the PDF from scripts/resume-pdf.ts.
   */
  const printVersion = () => {
    if (!resumeData) return;
    window.print();
  };

  const copyMarkdown = async () => {
    if (!resumeData) return;
    await navigator.clipboard.writeText(renderResumeMarkdown(resumeData));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_200px_minmax(0,1fr)]">
      {/* Applications */}
      <aside className="min-h-0 overflow-y-auto border-r border-border">
        <div className="border-b border-border p-3">
          <button
            onClick={openNew}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg hover:opacity-90"
          >
            + New tailoring
          </button>
        </div>
        {isLoading && <p className="p-4 text-sm text-text-dim">Loading…</p>}
        {error && <p className="p-4 text-sm text-red-400">{error.message}</p>}
        {!isLoading && applications.length === 0 && (
          <p className="p-4 text-sm text-text-dim">No applications yet.</p>
        )}
        {applications.map((app) => (
          <button
            key={app.id}
            onClick={() => {
              setSelectedAppId(app.id);
              setSelectedVersionId(null);
              setFormOpen(false);
            }}
            className={`block w-full border-b border-border px-4 py-3 text-left hover:bg-surface ${
              selectedApp?.id === app.id ? "bg-surface" : ""
            }`}
          >
            <div className="truncate text-sm font-medium text-text">{app.role}</div>
            <div className="truncate text-xs text-text-muted">{app.company}</div>
            <div className="mt-0.5 text-xs text-text-dim">{fmt(app.updatedAt)}</div>
          </button>
        ))}
      </aside>

      {/* Versions */}
      <aside className="min-h-0 overflow-y-auto border-r border-border">
        {!selectedApp ? (
          <p className="p-4 text-sm text-text-dim">Select an application.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 border-b border-border p-3">
              <button
                onClick={() => openRegenerate(selectedApp)}
                disabled={busy}
                className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-text hover:bg-border-strong disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={() => remove(selectedApp)}
                disabled={busy}
                className="w-full rounded-lg px-3 py-1.5 text-xs text-text-dim hover:text-red-400 disabled:opacity-50"
              >
                Delete application
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="p-4 text-sm text-text-dim">No versions yet.</p>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`block w-full border-b border-border px-4 py-3 text-left hover:bg-surface ${
                    selectedVersion?.id === v.id ? "bg-surface" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-text">v{v.version}</div>
                  <div className="mt-0.5 text-xs text-text-dim">{fmt(v.createdAt)}</div>
                </button>
              ))
            )}
          </>
        )}
      </aside>

      {/* Preview / form */}
      <main className="min-h-0 overflow-y-auto">
        {err && <p className="border-b border-border bg-red-500/10 p-4 text-sm text-red-400">{err}</p>}

        {formOpen ? (
          <form onSubmit={submit} className="flex flex-col gap-3 p-5">
            <h2 className="text-base font-semibold text-text">
              {selectedApp ? `Regenerate — ${selectedApp.role}` : "New tailoring"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
              />
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Role"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
              />
            </div>
            <textarea
              required
              rows={14}
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              placeholder="Paste the job description…"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Tailoring…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-text-muted hover:text-text"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : !selectedVersion || !resumeData ? (
          <p className="p-5 text-sm text-text-dim">
            {selectedApp ? "Select a version." : "Create a tailoring to get started."}
          </p>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
              <button
                onClick={printVersion}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-bg hover:opacity-90"
              >
                Print to PDF
              </button>
              <button
                onClick={copyMarkdown}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-text hover:bg-border-strong"
              >
                {copied ? "Copied" : "Copy as Markdown"}
              </button>
              <span className="ml-auto text-xs text-text-dim">
                v{selectedVersion.version} · {selectedVersion.model ?? "—"}
              </span>
            </div>

            {selectedVersion.notes && (
              <p className="border-b border-border px-4 py-3 text-sm text-text-muted">
                {selectedVersion.notes}
              </p>
            )}

            <div className="overflow-x-auto bg-white p-4">
              <style dangerouslySetInnerHTML={{ __html: resumeCSS + PRINT_SCOPE_CSS }} />
              <div
                className="resume-doc"
                dangerouslySetInnerHTML={{ __html: renderResumeBody(resumeData) }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
