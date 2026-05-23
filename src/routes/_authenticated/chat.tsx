import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PanelLeft, MessageSquareDashed, SquarePen, LogOut } from "lucide-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Sidebar } from "@/components/chat/Sidebar";
import { Composer } from "@/components/chat/Composer";
import { ChatView } from "@/components/chat/ChatView";
import { auth } from "@/lib/firebase";
import type { ChatAttachment, ChatMessage, Conversation, Project } from "@/components/chat/types";

export const Route = createFileRoute("/_authenticated/chat")({
  component: HalaGPTChat,
  head: () => ({
    meta: [
      { title: "HalaGPT — Chat" },
      { name: "description", content: "Chat with HalaGPT — a Palestinian AI assistant." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/chat" }],
  }),
});

const STORAGE_KEY = "halagpt:conversations:v2";
const PROJECTS_KEY = "halagpt:projects:v1";
const MEMORY_KEY = "halagpt:memory:v1";
const MAX_MEMORY = 120;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function HalaGPTChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [memory, setMemory] = useState<string[]>([]);

  useEffect(() => {
    const c = loadJson<Conversation[]>(STORAGE_KEY, []);
    setConversations(c);
    setProjects(loadJson<Project[]>(PROJECTS_KEY, []));
    setMemory(loadJson<string[]>(MEMORY_KEY, []));
    if (c.length > 0) setActiveId(c[0].id);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  }, [memory]);

  const learnFromExchange = async (userMsg: ChatMessage, replyText: string) => {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: userMsg.content },
            { role: "assistant", content: replyText },
          ],
        }),
      });
      const data = (await res.json()) as { facts?: string[] };
      const fresh = (data.facts ?? []).map((s) => s.trim()).filter(Boolean);
      if (fresh.length === 0) return;
      setMemory((prev) => {
        const seen = new Set(prev.map((f) => f.toLowerCase()));
        const merged = [...prev];
        for (const f of fresh) {
          if (!seen.has(f.toLowerCase())) {
            merged.push(f);
            seen.add(f.toLowerCase());
          }
        }
        return merged.slice(-MAX_MEMORY);
      });
    } catch {
      // memory learning is best-effort
    }
  };

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const isEmpty = !active || active.messages.length === 0;

  const deleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const renameChat = (id: string, title: string) =>
    setConversations((p) => p.map((c) => (c.id === id ? { ...c, title } : c)));
  const togglePin = (id: string) =>
    setConversations((p) => p.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  const toggleArchive = (id: string) => {
    setConversations((p) => p.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
    if (activeId === id) setActiveId(null);
  };
  const createProject = (p: Omit<Project, "id" | "createdAt">) =>
    setProjects((prev) => [{ id: uid(), createdAt: Date.now(), ...p }, ...prev]);

  const handleUpload = async (file: File): Promise<ChatAttachment> => {
    const previewUrl = file.type.startsWith("image/") ? await fileToDataUrl(file) : undefined;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string; mime?: string; size?: number };
    if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
    return { url: data.url, mime: data.mime || file.type || "application/octet-stream", name: file.name, size: data.size ?? file.size, previewUrl };
  };

  const setFeedback = (messageId: string, v: "up" | "down" | null) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === messageId ? { ...m, feedback: v } : m)),
      })),
    );
  };


  const callApi = async (msgs: ChatMessage[], deepThink: boolean): Promise<string> => {
    const payload = {
      deepThink,
      memory,
      messages: msgs.map((m) => ({
        role: m.role,
        content: m.content,
        links: m.attachments?.map((a) => a.url),
      })),
    };
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: { content?: string; error?: string } = {};
    try {
      data = (await res.json()) as { content?: string; error?: string };
    } catch {
      throw new Error(`Server returned ${res.status}`);
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.content ?? "";
  };

  const send = async (
    text: string,
    attachments: ChatAttachment[],
    opts: { deepThink: boolean; search: boolean },
  ) => {
    let convo = active;
    if (!convo) {
      convo = { id: uid(), title: text.slice(0, 40) || "New chat", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      if (!temporary) setConversations((prev) => [convo!, ...prev]);
      setActiveId(convo.id);
    }
    let userText = text;
    if (opts.search && text.trim()) {
      userText = `[Web search requested] ${text}`;
    }
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: userText,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: Date.now(),
    };
    const placeholder: ChatMessage = { id: uid(), role: "assistant", content: "", createdAt: Date.now() };
    const baseMessages = [...convo.messages, userMsg];
    const isFirst = convo.messages.length === 0;
    const targetId = convo.id;

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === targetId);
      const next: Conversation = {
        ...convo!,
        messages: [...baseMessages, placeholder],
        title: isFirst ? text.slice(0, 40) || (temporary ? "Temporary" : "New chat") : convo!.title,
        updatedAt: Date.now(),
      };
      if (temporary && !exists) return [next, ...prev];
      return exists ? prev.map((c) => (c.id === targetId ? next : c)) : [next, ...prev];
    });

    setLoading(true);
    try {
      const reply = await callApi(baseMessages, opts.deepThink);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === placeholder.id ? { ...m, content: reply } : m)),
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
      if (!temporary) void learnFromExchange(userMsg, reply);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === placeholder.id ? { ...m, content: `⚠️ ${msg}` } : m)),
              }
            : c,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    if (!active || loading) return;
    const targetId = active.id;
    const msgs = [...active.messages];
    while (msgs.length && msgs[msgs.length - 1].role === "assistant") msgs.pop();
    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return;
    const placeholder: ChatMessage = { id: uid(), role: "assistant", content: "", createdAt: Date.now() };
    setConversations((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, messages: [...msgs, placeholder], updatedAt: Date.now() } : c)),
    );
    setLoading(true);
    try {
      const reply = await callApi(msgs, false);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, messages: c.messages.map((m) => (m.id === placeholder.id ? { ...m, content: reply } : m)) }
            : c,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, messages: c.messages.map((m) => (m.id === placeholder.id ? { ...m, content: `⚠️ ${msg}` } : m)) }
            : c,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <div
      className={`relative flex h-dvh w-full overflow-hidden text-foreground transition-colors duration-500 ${
        temporary ? "bg-black" : "bg-background"
      }`}
    >
      {temporary && <div className="pointer-events-none absolute inset-0 bg-black" />}

      <Sidebar
        conversations={conversations}
        projects={projects}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setTemporary(false);
        }}
        onNew={() => {
          setActiveId(null);
          setTemporary(false);
        }}
        onDelete={deleteChat}
        onRename={renameChat}
        onTogglePin={togglePin}
        onToggleArchive={toggleArchive}
        onCreateProject={createProject}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className={`relative z-[1] flex min-w-0 flex-1 flex-col ${temporary ? "text-[oklch(0.98_0_0)]" : ""}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`pointer-events-auto grid h-11 w-11 place-items-center rounded-full border shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-95 ${
              temporary ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-border bg-background/85 text-foreground hover:bg-[oklch(0.97_0_0)]"
            }`}
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => {
                setTemporary(false);
                setActiveId(null);
              }}
              className={`grid h-11 w-11 place-items-center rounded-full border shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-95 ${
                temporary ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-border bg-background/85 text-foreground hover:bg-[oklch(0.97_0_0)]"
              }`}
              aria-label="New chat"
              title="New chat"
            >
              <SquarePen size={18} />
            </button>
            <button
              onClick={() => {
                setTemporary((t) => !t);
                setActiveId(null);
              }}
              className={`grid h-11 w-11 place-items-center rounded-full border shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-95 ${
                temporary ? "border-white/30 bg-white text-[#000]" : "border-border bg-background/85 text-foreground hover:bg-[oklch(0.97_0_0)]"
              }`}
              aria-label="Temporary chat"
              aria-pressed={temporary}
              title="Temporary chat"
            >
              <MessageSquareDashed size={18} />
            </button>
            <button
              onClick={signOut}
              className={`grid h-11 w-11 place-items-center rounded-full border shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-95 ${
                temporary ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-border bg-background/85 text-foreground hover:bg-[oklch(0.97_0_0)]"
              }`}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {isEmpty && temporary && (
          <div className="pointer-events-none absolute inset-x-0 top-[24vh] z-0 flex justify-center">
            <h2 className="text-[24px] font-medium tracking-tight text-white/90">Temporary</h2>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isEmpty ? "opacity-0" : "opacity-100"}`}>
          <ChatView messages={active?.messages ?? []} loading={loading} onRegenerate={regenerate} onFeedback={setFeedback} />
        </div>

        <div className={`relative z-10 transition-all duration-500 ease-out ${isEmpty ? "-translate-y-[20vh]" : "translate-y-0"}`}>
          <Composer
            onSend={send}
            loading={loading}
            luxe={temporary}
            onUpload={handleUpload}
            onImageRequest={() => alert("Image studio is in beta — coming soon.")}
          />
        </div>
      </main>
    </div>
  );
}
