import { useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { db, isConfigured } from "../../lib/instant";
import { Centered, OWNER_EMAIL } from "./shared";
import ChatSessions from "./ChatSessions";
import ResumeStudio from "./ResumeStudio";

type Tab = "chat" | "resume";

export default function AdminApp() {
  if (!isConfigured) {
    return (
      <Centered>
        <p className="text-text-muted">
          InstantDB isn't configured. Set <code>PUBLIC_INSTANT_APP_ID</code> and rebuild.
        </p>
      </Centered>
    );
  }

  return (
    <>
      <db.SignedIn>
        <Shell />
      </db.SignedIn>
      <db.SignedOut>
        <Login />
      </db.SignedOut>
    </>
  );
}

function Shell() {
  const user = db.useUser();
  const [tab, setTab] = useState<Tab>("chat");

  if (user.email !== OWNER_EMAIL) {
    return (
      <Centered>
        <p className="mb-4 text-text-muted">
          Signed in as {user.email}, which isn't the owner account.
        </p>
        <button
          onClick={() => db.auth.signOut()}
          className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-text hover:bg-border-strong"
        >
          Sign out
        </button>
      </Centered>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <nav className="flex gap-1">
          <TabButton active={tab === "chat"} onClick={() => setTab("chat")}>
            Chat sessions
          </TabButton>
          <TabButton active={tab === "resume"} onClick={() => setTab("resume")}>
            Résumé
          </TabButton>
        </nav>
        <button
          onClick={() => db.auth.signOut()}
          className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text"
        >
          Sign out
        </button>
      </header>

      {tab === "chat" ? <ChatSessions /> : <ResumeStudio />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-surface-2 text-text" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  const sendCode = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError("");
    try {
      await db.auth.sendMagicCode({ email });
      setSentTo(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    }
  };

  const verify = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError("");
    try {
      await db.auth.signInWithMagicCode({ email: sentTo, code });
    } catch (err) {
      setCode("");
      setError(err instanceof Error ? err.message : "Invalid code.");
    }
  };

  return (
    <Centered>
      <h1 className="mb-1 text-xl font-semibold text-text">Admin sign in</h1>
      <p className="mb-6 text-sm text-text-dim">Magic-code login for the site owner.</p>
      {!sentTo ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg hover:opacity-90">
            Send code
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <p className="text-sm text-text-muted">
            Code sent to <strong className="text-text">{sentTo}</strong>.
          </p>
          <input
            type="text"
            inputMode="numeric"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg hover:opacity-90">
            Verify
          </button>
          <button
            type="button"
            onClick={() => {
              setSentTo("");
              setCode("");
              setError("");
            }}
            className="text-xs text-text-dim hover:text-text-muted"
          >
            Use a different email
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </Centered>
  );
}
