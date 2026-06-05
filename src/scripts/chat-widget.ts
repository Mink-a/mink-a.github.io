/**
 * Public chat widget — vanilla TS, no framework, so visitors don't download
 * React or the InstantDB client. Talks to the streaming /api/chat endpoint and
 * renders replies as plain text (XSS-safe via textContent).
 */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_VISITOR = "mkk-chat-visitor";
const STORAGE_HISTORY = "mkk-chat-history";
const MAX_SEND = 8;
const MAX_CONTENT = 8000; // keep in sync with the server's per-message cap

const GREETING =
  "Hi! I'm Min's assistant. Ask me about his experience, projects, skills, or writing.";

// Trivial messages answered locally — no network call, no tokens. Matched
// against the WHOLE normalized message, so "hi, what projects?" still goes to
// the model. Static lookup tables (Record per project convention).
const GREETINGS: Record<string, true> = {
  hi: true, hello: true, hey: true, heya: true, hiya: true, yo: true, sup: true,
  howdy: true, hola: true, gm: true, "good morning": true, "good afternoon": true,
  "good evening": true, "good day": true,
};
const THANKS: Record<string, true> = {
  thanks: true, "thank you": true, "thank u": true, ty: true, thx: true, cheers: true,
};
const FAREWELLS: Record<string, true> = {
  bye: true, goodbye: true, "good night": true, goodnight: true, "see you": true,
  "see ya": true, cya: true, "take care": true,
};

function cannedReply(raw: string): string | null {
  const t = raw.trim().toLowerCase().replace(/[!.?,…\s]+$/u, "");
  if (GREETINGS[t]) return "Hi! I'm Min's assistant — ask me anything about his projects, experience, skills, or background.";
  if (THANKS[t]) return "You're welcome! Anything else you'd like to know about Min?";
  if (FAREWELLS[t]) return "Thanks for stopping by — come back anytime!";
  return null;
}

function getVisitorId(): string {
  let v = localStorage.getItem(STORAGE_VISITOR);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(STORAGE_VISITOR, v);
  }
  return v;
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_HISTORY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function initChatWidget(): void {
  const root = document.getElementById("chat-assistant");
  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const clearBtn = document.getElementById("chat-clear");
  const messagesEl = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input") as HTMLTextAreaElement | null;
  const sendBtn = document.getElementById("chat-send") as HTMLButtonElement | null;
  if (!root || !launcher || !panel || !closeBtn || !clearBtn || !messagesEl || !input || !sendBtn) {
    return;
  }
  // The widget persists across view-transition navigations, so guard against
  // re-wiring the same (already-listening) elements a second time.
  if (root.dataset.chatReady === "1") return;
  root.dataset.chatReady = "1";

  const messages = loadHistory();
  let streaming = false;

  const saveHistory = () => {
    try {
      sessionStorage.setItem(STORAGE_HISTORY, JSON.stringify(messages.slice(-30)));
    } catch {
      // sessionStorage unavailable (private mode, quota) — non-fatal.
    }
  };

  const renderMessage = (role: ChatMessage["role"], content: string): HTMLElement => {
    const row = document.createElement("div");
    row.className = role === "user" ? "flex justify-end" : "flex justify-start";
    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-bg whitespace-pre-wrap break-words"
        : "max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-sm text-text whitespace-pre-wrap break-words";
    bubble.textContent = content;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  };

  const autoResize = () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  };

  // Keep the full-screen mobile overlay glued to the *visual* viewport. The
  // on-screen keyboard shrinks the visual viewport (not the layout viewport), so
  // a plain `fixed` overlay gets scrolled upward by the browser to reveal the
  // focused input. Tracking visualViewport pins the panel and simply shrinks it
  // above the keyboard instead. Only relevant below `sm`, where the panel is
  // full-screen; the >=sm popover isn't reflowed by the keyboard.
  const mqlFullscreen = window.matchMedia("(max-width: 639.98px)");
  const syncOverlayToViewport = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    if (panel.classList.contains("hidden") || !mqlFullscreen.matches) {
      panel.style.top = "";
      panel.style.height = "";
      return;
    }
    panel.style.top = `${vv.offsetTop}px`;
    panel.style.height = `${vv.height}px`;
  };
  window.visualViewport?.addEventListener("resize", syncOverlayToViewport);
  window.visualViewport?.addEventListener("scroll", syncOverlayToViewport);
  mqlFullscreen.addEventListener("change", syncOverlayToViewport);

  const setOpen = (open: boolean) => {
    panel.classList.toggle("hidden", !open);
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      messagesEl.scrollTop = messagesEl.scrollHeight; // show the latest message
      // Auto-focus only the desktop popover. On the mobile full-screen overlay,
      // popping the keyboard the instant it opens would jolt the layout; visitors
      // tap the field when they want to type.
      if (!mqlFullscreen.matches) input.focus();
    }
    syncOverlayToViewport();
  };

  const send = async (text: string) => {
    if (streaming) return;
    input.value = "";
    autoResize();

    messages.push({ role: "user", content: text });
    renderMessage("user", text);

    // Greetings/pleasantries: reply locally, skip the LLM entirely.
    const canned = cannedReply(text);
    if (canned) {
      messages.push({ role: "assistant", content: canned });
      saveHistory();
      renderMessage("assistant", canned);
      return;
    }
    saveHistory();

    streaming = true;
    input.disabled = true;
    sendBtn.disabled = true;
    const bubble = renderMessage("assistant", "…");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          messages: messages.slice(-MAX_SEND).map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT) })),
          client: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            screen: `${window.screen.width}x${window.screen.height}`,
            referrer: document.referrer || undefined,
          },
        }),
      });

      if (!res.ok || !res.body) {
        bubble.textContent =
          res.status === 429
            ? "You're sending messages too quickly. Please wait a moment and try again."
            : "Sorry, something went wrong. Please try again later.";
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      bubble.textContent = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        bubble.textContent = assistant;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      if (assistant) {
        messages.push({ role: "assistant", content: assistant });
        saveHistory();
      } else {
        bubble.textContent = "(no response)";
      }
    } catch {
      bubble.textContent = "Sorry, something went wrong. Please try again later.";
    } finally {
      streaming = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  };

  renderMessage("assistant", GREETING);
  for (const m of messages) renderMessage(m.role, m.content);

  launcher.addEventListener("click", () => setOpen(panel.classList.contains("hidden")));
  closeBtn.addEventListener("click", () => setOpen(false));
  clearBtn.addEventListener("click", () => {
    messages.length = 0;
    saveHistory();
    messagesEl.replaceChildren();
    renderMessage("assistant", GREETING);
    input.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("hidden")) setOpen(false);
  });

  const submit = () => {
    const text = input.value.trim();
    if (text) void send(text);
  };
  sendBtn.addEventListener("click", submit);
  input.addEventListener("input", autoResize);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });
}

// Re-run on every ClientRouter navigation (and initial load); the dataset guard
// makes it idempotent for the persisted widget.
document.addEventListener("astro:page-load", initChatWidget);
