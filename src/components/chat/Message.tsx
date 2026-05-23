import { useEffect, useRef, useState } from "react";
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Brain, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "./Markdown";
import { FileBadge } from "./FileIcon";
import type { ChatMessage } from "./types";

function detectDir(text: string): "ltr" | "rtl" {
  if (!text) return "ltr";
  const stripped = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  const rtlChars = stripped.match(/[\u0590-\u08FF\uFB1D-\uFEFC]/g)?.length ?? 0;
  const latinChars = stripped.match(/[A-Za-z]/g)?.length ?? 0;
  if (rtlChars === 0) return "ltr";
  return rtlChars >= latinChars ? "rtl" : "ltr";
}

// If the upstream returned literal escape sequences (e.g. "\\n", "\\t",
// "\\\""), decode them so Markdown actually renders newlines/quotes instead
// of showing the backslash characters.
function decodeEscapes(s: string): string {
  if (!s) return s;
  if (s.indexOf("\\n") === -1 && s.indexOf("\\t") === -1 && s.indexOf('\\"') === -1) return s;
  return s
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"');
}

function splitThinking(raw: string): { thinking: string | null; answer: string; thinkingOpen: boolean } {
  const text = decodeEscapes(raw);
  const openIdx = text.indexOf("<thinking>");
  if (openIdx === -1) return { thinking: null, answer: text, thinkingOpen: false };
  const closeIdx = text.indexOf("</thinking>", openIdx);
  if (closeIdx === -1) {
    return {
      thinking: text.slice(openIdx + "<thinking>".length).trim(),
      answer: "",
      thinkingOpen: true,
    };
  }
  const thinking = text.slice(openIdx + "<thinking>".length, closeIdx).trim();
  const answer = text.slice(closeIdx + "</thinking>".length).trim();
  return { thinking, answer, thinkingOpen: false };
}

export function UserMessage({ m }: { m: ChatMessage }) {
  const dir = detectDir(m.content);
  return (
    <div className="flex w-full justify-end animate-rise">
      <div className="max-w-[85%] space-y-2">
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {m.attachments.map((a, i) =>
              a.mime.startsWith("image/") ? (
                <img
                  key={i}
                  src={a.previewUrl ?? a.url}
                  alt={a.name}
                  className="max-h-60 rounded-2xl border border-border object-cover"
                />
              ) : (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block w-64">
                  <FileBadge name={a.name} mime={a.mime} size={a.size} />
                </a>
              ),
            )}
          </div>
        )}
        {m.content && (
          <div
            dir={dir}
            className={`rounded-3xl rounded-tr-md bg-[oklch(0.96_0_0)] px-4 py-2.5 text-[15px] leading-7 text-foreground whitespace-pre-wrap break-words ${
              dir === "rtl" ? "text-right" : ""
            }`}
          >
            {m.content}
          </div>
        )}
      </div>
    </div>
  );
}

// Slower, smoother typewriter — feels deliberate, not jittery.
function useTypewriter(content: string, enabled: boolean, onTick?: () => void) {
  const [shown, setShown] = useState(enabled ? "" : content);
  const idxRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!enabled) {
      setShown(content);
      idxRef.current = content.length;
      return;
    }
    if (idxRef.current > content.length) {
      idxRef.current = 0;
      setShown("");
    }
    const step = (t: number) => {
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      const remaining = content.length - idxRef.current;
      if (remaining <= 0) {
        rafRef.current = null;
        return;
      }
      // ~45 cps base (slower & smoother than before), with mild boost if backlog
      const baseCps = 45;
      const boost = Math.min(2.5, 1 + remaining / 400);
      const inc = Math.max(1, Math.round((dt / 1000) * baseCps * boost));
      idxRef.current = Math.min(content.length, idxRef.current + inc);
      setShown(content.slice(0, idxRef.current));
      tickRef.current?.();
      rafRef.current = requestAnimationFrame(step);
    };
    if (rafRef.current == null && idxRef.current < content.length) {
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [content, enabled]);
  return { shown, isTyping: enabled && shown.length < content.length };
}

function ThinkingBlock({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(true);
  const dir = detectDir(text);
  return (
    <div className="my-3 rounded-2xl border border-border bg-[oklch(0.985_0_0)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-muted-foreground hover:bg-[oklch(0.97_0_0)] transition"
      >
        <span className="inline-flex items-center gap-2">
          <Brain size={14} className={streaming ? "animate-pulse" : ""} />
          {streaming ? "Thinking…" : "Thought process"}
        </span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          dir={dir}
          className={`border-t border-border px-4 py-3 text-[13px] leading-6 text-muted-foreground ${
            dir === "rtl" ? "[&_p]:text-right [&_li]:text-right" : ""
          }`}
        >
          <Markdown content={text} />
        </div>
      )}
    </div>
  );
}

export function AssistantMessage({
  m,
  streaming,
  onRegenerate,
  onFeedback,
}: {
  m: ChatMessage;
  streaming?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (v: "up" | "down" | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = () => anchorRef.current?.scrollIntoView({ block: "end" });

  const initialEmptyRef = useRef(m.content === "");
  const { shown, isTyping } = useTypewriter(m.content, initialEmptyRef.current, scrollToEnd);

  const copy = async () => {
    await navigator.clipboard.writeText(m.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const setFeedback = (v: "up" | "down") => {
    const next = m.feedback === v ? null : v;
    onFeedback?.(next);
    if (next === "up") toast.success("Thanks for the feedback");
    else if (next === "down") toast("Feedback noted", { description: "We'll use this to improve." });
  };

  const { thinking, answer, thinkingOpen } = splitThinking(shown);
  const dir = detectDir(answer);
  const showThinking = streaming && !m.content;
  const feedback = m.feedback ?? null;

  return (
    <div className="w-full animate-rise">
      {showThinking ? (
        <div className="py-2">
          <span className="block h-2.5 w-2.5 rounded-full bg-foreground animate-pulse-dot" />
        </div>
      ) : (
        <>
          {thinking !== null && <ThinkingBlock text={thinking} streaming={thinkingOpen} />}
          {answer && (
            <div dir={dir} className={dir === "rtl" ? "[&_p]:text-right [&_li]:text-right [&_h1]:text-right [&_h2]:text-right [&_h3]:text-right" : ""}>
              <Markdown content={answer} />
            </div>
          )}
        </>
      )}
      <div ref={anchorRef} />
      {!streaming && !isTyping && m.content && (
        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-accent hover:text-foreground transition"
            aria-label="Copy"
            title="Copy"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-accent hover:text-foreground transition"
              aria-label="Regenerate"
              title="Regenerate"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={() => setFeedback("up")}
            className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition hover:bg-accent hover:text-foreground ${
              feedback === "up" ? "bg-accent text-foreground" : ""
            }`}
            aria-label="Good response"
            aria-pressed={feedback === "up"}
            title="Good response"
          >
            <ThumbsUp size={13} fill={feedback === "up" ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setFeedback("down")}
            className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition hover:bg-accent hover:text-foreground ${
              feedback === "down" ? "bg-accent text-foreground" : ""
            }`}
            aria-label="Bad response"
            aria-pressed={feedback === "down"}
            title="Bad response"
          >
            <ThumbsDown size={13} fill={feedback === "down" ? "currentColor" : "none"} />
          </button>
        </div>
      )}
    </div>
  );
}
