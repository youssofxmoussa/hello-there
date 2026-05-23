import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Plus,
  Square,
  X,
  FileImage,
  Lightbulb,
  Camera,
  Image as ImageIcon,
  Paperclip,
  Globe,
  ImagePlus,
  Check,
  Loader2,
} from "lucide-react";
import type { ChatAttachment } from "./types";
import { FileGlyph, formatBytes } from "./FileIcon";

type Props = {
  onSend: (text: string, attachments: ChatAttachment[], opts: { deepThink: boolean; search: boolean }) => void;
  loading: boolean;
  onStop?: () => void;
  luxe?: boolean;
  onUpload: (file: File) => Promise<ChatAttachment>;
  onImageRequest?: () => void;
};

const MAX_ATTACHMENTS = 10;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function Composer({ onSend, loading, onStop, luxe = false, onUpload, onImageRequest }: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [search, setSearch] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const uploading = attachments.some((a) => a.uploading);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const dir: "ltr" | "rtl" = (() => {
    const stripped = text.replace(/```[\s\S]*?```/g, "");
    const m = stripped.match(/[A-Za-z\u0590-\u08FF\uFB1D-\uFEFC]/);
    if (!m) return "ltr";
    return /[\u0590-\u08FF\uFB1D-\uFEFC]/.test(m[0]) ? "rtl" : "ltr";
  })();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_ATTACHMENTS - attachments.length;
    const list = Array.from(files).slice(0, slots);

    // Insert optimistic placeholders with previewUrl + uploading:true
    const placeholders: ChatAttachment[] = await Promise.all(
      list.map(async (f) => ({
        url: "",
        name: f.name,
        mime: f.type || "application/octet-stream",
        size: f.size,
        previewUrl: f.type.startsWith("image/") ? await fileToDataUrl(f) : undefined,
        uploading: true,
      })),
    );
    const startIdx = attachments.length;
    setAttachments((prev) => [...prev, ...placeholders].slice(0, MAX_ATTACHMENTS));

    // Upload in parallel and patch each slot in place
    await Promise.all(
      list.map(async (f, i) => {
        const slot = startIdx + i;
        try {
          const finalAtt = await onUpload(f);
          setAttachments((prev) => {
            const next = [...prev];
            if (next[slot]) next[slot] = { ...finalAtt, uploading: false };
            return next;
          });
        } catch (e) {
          console.error("upload failed", e);
          setAttachments((prev) => prev.filter((_, j) => j !== slot));
        }
      }),
    );
  };

  const submit = () => {
    const t = text.trim();
    const ready = attachments.filter((a) => !a.uploading);
    if (!t && ready.length === 0) return;
    if (loading || uploading) return;
    onSend(t, ready, { deepThink, search });
    setText("");
    setAttachments([]);
    setSearch(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-[28px] border transition ${
          luxe
            ? "border-white/20 bg-white/[0.04] text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl focus-within:border-white/40"
            : "border-border bg-background text-foreground shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] focus-within:shadow-[0_16px_50px_-12px_rgba(0,0,0,0.22)] focus-within:border-foreground/40"
        } ${dragOver ? (luxe ? "ring-4 ring-white/15" : "border-foreground/60 ring-4 ring-foreground/5") : ""}`}
      >
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-background/85 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              <FileImage size={15} /> Drop files to attach
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="relative">
            <div
              className="flex gap-2.5 overflow-x-auto overflow-y-visible scroll-smooth px-4 pt-4 pb-2 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {attachments.map((a, i) => (
                <AttachmentPreview
                  key={i}
                  att={a}
                  onRemove={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                  luxe={luxe}
                />
              ))}
            </div>
            {/* edge fades hint at more content */}
            <div
              className={`pointer-events-none absolute left-0 top-0 h-full w-6 rounded-l-[28px] ${
                luxe ? "bg-gradient-to-r from-black/40 to-transparent" : "bg-gradient-to-r from-background to-transparent"
              }`}
            />
            <div
              className={`pointer-events-none absolute right-0 top-0 h-full w-6 rounded-r-[28px] ${
                luxe ? "bg-gradient-to-l from-black/40 to-transparent" : "bg-gradient-to-l from-background to-transparent"
              }`}
            />
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          dir={dir}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask HalaGPT"
          className={`block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 outline-none ${
            luxe ? "placeholder:text-white/40" : "placeholder:text-muted-foreground"
          } ${dir === "rtl" ? "text-right" : ""}`}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5 relative flex-wrap" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`group grid h-9 w-9 place-items-center rounded-full border transition ${
                luxe
                  ? "border-white/25 bg-transparent text-white hover:bg-white hover:text-black"
                  : "border-border bg-background text-foreground hover:bg-foreground hover:text-background hover:border-foreground"
              }`}
              aria-label="More actions"
              aria-expanded={menuOpen}
            >
              <Plus size={17} strokeWidth={2.25} className={`transition duration-300 ${menuOpen ? "rotate-45" : "group-hover:rotate-90"}`} />
            </button>

            {(deepThink || search) && (
              <div className="flex items-center gap-1.5">
                {deepThink && (
                  <ActiveChip icon={<Lightbulb size={13} />} label="Thinking" onClear={() => setDeepThink(false)} luxe={luxe} />
                )}
                {search && (
                  <ActiveChip icon={<Globe size={13} />} label="Search" onClear={() => setSearch(false)} luxe={luxe} />
                )}
              </div>
            )}

            {menuOpen && (
              <div
                className="absolute bottom-12 left-0 z-40 w-72 overflow-hidden rounded-3xl border border-border bg-background text-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl animate-rise"
              >
                <MenuItem
                  icon={<Camera size={18} />}
                  label="Camera"
                  onClick={() => {
                    setMenuOpen(false);
                    cameraRef.current?.click();
                  }}
                />
                <MenuItem
                  icon={<ImageIcon size={18} />}
                  label="Photos"
                  onClick={() => {
                    setMenuOpen(false);
                    photoRef.current?.click();
                  }}
                />
                <MenuItem
                  icon={<Paperclip size={18} />}
                  label="Files"
                  onClick={() => {
                    setMenuOpen(false);
                    fileRef.current?.click();
                  }}
                />
                <MenuItem
                  icon={<ImagePlus size={18} />}
                  label="Create image"
                  onClick={() => {
                    setMenuOpen(false);
                    onImageRequest?.();
                  }}
                />
                <MenuItem
                  icon={<Globe size={18} />}
                  label="Search"
                  active={search}
                  onClick={() => {
                    setSearch((s) => !s);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={<Lightbulb size={18} />}
                  label="Thinking"
                  active={deepThink}
                  onClick={() => {
                    setDeepThink((d) => !d);
                    setMenuOpen(false);
                  }}
                />
              </div>
            )}

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="*/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {loading ? (
            <button
              onClick={onStop}
              className={`grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90 ${
                luxe ? "bg-white text-[#000]" : "bg-foreground text-background"
              }`}
              aria-label="Stop"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={(!text.trim() && attachments.filter((a) => !a.uploading).length === 0) || uploading}
              className={`grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-25 ${
                luxe ? "bg-white text-[#000]" : "bg-foreground text-background"
              }`}
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <p className={`mt-2 text-center text-[11px] ${luxe ? "text-white/45" : "text-muted-foreground"}`}>
        HalaGPT can make mistakes. Verify important information.
      </p>
    </div>
  );
}

function AttachmentPreview({ att, onRemove, luxe }: { att: ChatAttachment; onRemove: () => void; luxe: boolean }) {
  const isImage = att.mime.startsWith("image/");
  return (
    <div className="group relative shrink-0 snap-start animate-rise">
      {isImage ? (
        <div
          className={`relative h-[76px] w-[76px] overflow-hidden rounded-2xl border shadow-sm transition ${
            luxe ? "border-white/15 bg-white/5" : "border-border bg-[oklch(0.97_0_0)]"
          } ${att.uploading ? "ring-2 ring-foreground/20" : ""}`}
        >
          <img
            src={att.previewUrl ?? att.url}
            alt={att.name}
            className={`h-full w-full object-cover transition duration-500 ${att.uploading ? "scale-110 blur-[2px] brightness-[0.55]" : ""}`}
          />
          {att.uploading && (
            <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-[1px]">
              <div className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/40">
                <Loader2 size={18} className="animate-spin text-white" strokeWidth={2.75} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative flex h-[76px] w-[200px] sm:w-[240px] items-center gap-3 overflow-hidden rounded-2xl border px-3 shadow-sm transition ${
            luxe ? "border-white/15 bg-white/[0.06] text-white" : "border-border bg-background text-foreground"
          } ${att.uploading ? "ring-2 ring-foreground/15" : ""}`}
        >
          <div className="relative shrink-0">
            <FileGlyph name={att.name} mime={att.mime} size={44} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-tight">{att.name}</div>
            <div className={`text-[11px] mt-0.5 truncate ${luxe ? "text-white/55" : "text-muted-foreground"}`}>
              {att.uploading
                ? "Uploading…"
                : `${(att.name.split(".").pop() ?? "file").toUpperCase()} · ${formatBytes(att.size)}`}
            </div>
            {att.uploading && (
              <div className={`mt-1.5 h-1 w-full overflow-hidden rounded-full ${luxe ? "bg-white/10" : "bg-foreground/10"}`}>
                <div className={`h-full w-1/3 rounded-full ${luxe ? "bg-white/70" : "bg-foreground/70"} animate-[slide_1.2s_ease-in-out_infinite]`} />
              </div>
            )}
          </div>
          {att.uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/55 backdrop-blur-[2px] dark:bg-background/40">
              <div className={`grid h-9 w-9 place-items-center rounded-full ${luxe ? "bg-white/15 ring-1 ring-white/40" : "bg-foreground/10 ring-1 ring-foreground/20"}`}>
                <Loader2 size={18} className={`animate-spin ${luxe ? "text-white" : "text-foreground"}`} strokeWidth={2.75} />
              </div>
            </div>
          )}
        </div>
      )}
      {!att.uploading && (
        <button
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background shadow-md ring-2 ring-background transition hover:scale-110"
          aria-label="Remove"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function ActiveChip({
  icon,
  label,
  onClear,
  luxe,
}: {
  icon: React.ReactNode;
  label: string;
  onClear: () => void;
  luxe: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium animate-rise ${
        luxe ? "border-white bg-white text-black" : "border-foreground bg-foreground text-background"
      }`}
    >
      {icon}
      {label}
      <button onClick={onClear} aria-label={`Disable ${label}`} className="grid h-4 w-4 place-items-center rounded-full hover:opacity-70">
        <X size={10} strokeWidth={3} />
      </button>
    </span>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-3.5 text-left text-[15px] transition hover:bg-[oklch(0.96_0_0)] active:bg-[oklch(0.94_0_0)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-foreground">
        {icon}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {active && <Check size={16} className="text-foreground/80" />}
    </button>
  );
}
