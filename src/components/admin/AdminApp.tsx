import { useState, useEffect, useRef } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "../../../instant.schema";
import { db, isConfigured } from "../../lib/instant";

const OWNER_EMAIL = "hello@minkhantkyaw.com";

type Message = InstaQLEntity<AppSchema, "messages">;
type Session = InstaQLEntity<AppSchema, "sessions">;
type SessionWithMessages = Session & { messages: Message[] };

const fmt = (v: number | string | Date) => new Date(v).toLocaleString();

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
        <Dashboard />
      </db.SignedIn>
      <db.SignedOut>
        <Login />
      </db.SignedOut>
    </>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
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

function Dashboard() {
  const user = db.useUser();
  const isOwner = user.email === OWNER_EMAIL;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { isLoading, error, data } = db.useQuery(isOwner ? { sessions: {}, messages: {} } : null);

  if (!isOwner) {
    return (
      <Centered>
        <p className="mb-4 text-text-muted">
          Signed in as {user.email}, which isn't the owner account.
        </p>
        <button onClick={() => db.auth.signOut()} className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-text hover:bg-border-strong">
          Sign out
        </button>
      </Centered>
    );
  }

  // Join + sort on the client so the query never depends on a custom index
  // (works whether or not the schema has been pushed to the app).
  const messagesBySession = new Map<string, Message[]>();
  for (const m of data?.messages ?? []) {
    const arr = messagesBySession.get(m.sessionId);
    if (arr) arr.push(m);
    else messagesBySession.set(m.sessionId, [m]);
  }
  const sessions: SessionWithMessages[] = (data?.sessions ?? [])
    .map((s) => ({
      ...s,
      messages: (messagesBySession.get(s.id) ?? []).sort(
        (a, b) => Number(a.createdAt) - Number(b.createdAt),
      ),
    }))
    .sort((a, b) => Number(b.startedAt ?? 0) - Number(a.startedAt ?? 0));
  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h1 className="text-base font-semibold text-text">Chat sessions</h1>
          <p className="text-xs text-text-dim">{sessions.length} total · live</p>
        </div>
        <button onClick={() => db.auth.signOut()} className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text">
          Sign out
        </button>
      </header>

      {isLoading && <p className="p-5 text-sm text-text-dim">Loading…</p>}
      {error && <p className="p-5 text-sm text-red-400">{error.message}</p>}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-border">
          {sessions.length === 0 && !isLoading ? (
            <p className="p-5 text-sm text-text-dim">No conversations yet.</p>
          ) : (
            sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                active={selected?.id === s.id}
                onClick={() => setSelectedId(s.id)}
              />
            ))
          )}
        </aside>
        <main className="min-h-0 overflow-y-auto">
          {selected ? <Conversation session={selected} /> : null}
        </main>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  active,
  onClick,
}: {
  session: SessionWithMessages;
  active: boolean;
  onClick: () => void;
}) {
  const place = [session.city, session.country].filter(Boolean).join(", ") || "Unknown";
  const ua = [session.browser, session.os].filter(Boolean).join(" · ") || "—";
  return (
    <button
      onClick={onClick}
      className={`block w-full border-b border-border px-4 py-3 text-left hover:bg-surface ${active ? "bg-surface" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{place}</span>
        <span className="text-xs text-text-dim">{session.messages.length} msgs</span>
      </div>
      <div className="mt-0.5 text-xs text-text-muted">{ua}</div>
      <div className="mt-0.5 text-xs text-text-dim">{fmt(session.startedAt)}</div>
    </button>
  );
}

function Conversation({ session }: { session: SessionWithMessages }) {
  const messages = [...session.messages].sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [session.id]);
  return (
    <div className="flex flex-col">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-border px-5 py-4 text-xs sm:grid-cols-3">
        <Meta label="Timezone" value={session.timezone} />
        <Meta label="Locale" value={session.locale} />
        <Meta label="Location" value={[session.city, session.country].filter(Boolean).join(", ")} />
        <Meta label="Browser" value={session.browser} />
        <Meta label="OS" value={session.os} />
        <Meta label="Device" value={session.device} />
        <Meta label="Screen" value={session.screen} />
        <Meta label="Referrer" value={session.referrer} />
        <Meta label="Last seen" value={fmt(session.lastSeenAt)} />
      </dl>
      <div className="flex flex-col gap-3 p-5">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-text-dim">{label}</dt>
      <dd className="truncate text-text-muted" title={value ?? undefined}>
        {value || "—"}
      </dd>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const tokens =
    message.inputTokens != null || message.outputTokens != null
      ? `${message.inputTokens ?? "?"} in / ${message.outputTokens ?? "?"} out`
      : null;
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isUser ? "bg-accent text-bg" : "bg-surface-2 text-text"}`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`mt-1 text-[10px] ${isUser ? "text-bg/70" : "text-text-dim"}`}>
          {fmt(message.createdAt)}
          {message.model ? ` · ${message.model}` : ""}
          {tokens ? ` · ${tokens}` : ""}
        </div>
      </div>
    </div>
  );
}
