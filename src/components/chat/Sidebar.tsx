import {
  Search,
  X,
  Folder,
  Image as ImageIcon,
  MoreHorizontal,
  SquarePen,
  Trash2,
  Pin,
  Pencil,
  Archive,
  ArrowLeft,
  Plus,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Feather,
  Plane,
  Dumbbell,
  Briefcase,
  Heart,
  Code2,
  Palette,
  GraduationCap,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { Conversation, Project } from "./types";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import logoUrl from "@/assets/halagpt-logo.png";

function UserAvatar() {
  const photo = auth.currentUser?.photoURL;
  if (photo) {
    return <img src={photo} alt="" className="h-9 w-9 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.94_0_0)] text-foreground">
      <User size={18} strokeWidth={2} />
    </span>
  );
}

type View = "home" | "projects" | "images";

type Props = {
  conversations: Conversation[];
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onCreateProject: (p: Omit<Project, "id" | "createdAt">) => void;
  open: boolean;
  onToggle: () => void;
};

export function Sidebar({
  conversations,
  projects,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onToggleArchive,
  onCreateProject,
  open,
  onToggle,
}: Props) {
  const [view, setView] = useState<View>("home");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  const visible = conversations.filter((c) => !c.archived);
  const filtered = visible
    .filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || b.updatedAt - a.updatedAt);

  const allImages = conversations.flatMap((c) =>
    c.messages.flatMap((m) =>
      (m.images ?? []).map((img) => ({ ...img, convoId: c.id, title: c.title })),
    ),
  );

  // Close menu on outside click
  useEffect(() => {
    if (!menuFor) return;
    const h = () => setMenuFor(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, [menuFor]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background transition-all duration-300 ${
        open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-full flex-col">
        {/* Top bar */}
        {view === "home" ? (
          <div className="flex items-center justify-between px-5 pt-6 pb-2">
            <Link
              to="/settings"
              onClick={onToggle}
              className="flex items-center gap-2.5 rounded-full pr-3 transition hover:bg-[oklch(0.97_0_0)]"
              aria-label="Open settings"
            >
              <UserAvatar />
              <h1 className="text-2xl font-semibold tracking-tight">HalaGPT</h1>
            </Link>
            <div className="flex items-center gap-1 rounded-full bg-[oklch(0.96_0_0)] px-1 py-1">
              <button
                onClick={() => setSearching((s) => !s)}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground transition hover:bg-background"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={2} />
              </button>
              <button
                onClick={onToggle}
                className="grid h-9 w-9 place-items-center rounded-full bg-background text-foreground transition hover:opacity-80"
                aria-label="Close sidebar"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 items-center px-4 pt-6 pb-2">
            <button
              onClick={() => setView("home")}
              className="grid h-11 w-11 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-foreground transition hover:bg-[oklch(0.93_0_0)]"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-center text-[22px] font-semibold tracking-tight">
              {view === "projects" ? "Projects" : "Images"}
            </h2>
            {view === "projects" ? (
              <button
                onClick={() => setShowNewProject(true)}
                className="justify-self-end grid h-11 w-11 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-foreground transition hover:bg-[oklch(0.93_0_0)]"
                aria-label="New project"
              >
                <Plus size={18} />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}

        {view === "home" && searching && (
          <div className="px-5 pt-2">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chats"
                className="w-full rounded-full border border-border bg-[oklch(0.98_0_0)] py-2.5 pl-11 pr-10 text-[15px] outline-none focus:border-foreground/40"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        {view === "home" && (
          <>
            <div className="mt-4 px-3">
              <QuickItem icon={<Folder size={20} strokeWidth={1.75} />} label="Projects" onClick={() => setView("projects")} />
              <QuickItem icon={<ImageIcon size={20} strokeWidth={1.75} />} label="Images" onClick={() => setView("images")} />
              <QuickItem icon={<MoreHorizontal size={20} strokeWidth={1.75} />} label="More" />
            </div>
            <div className="mt-6 flex-1 overflow-y-auto px-3 pb-32">
              <div className="px-3 pb-2 text-[17px] font-semibold tracking-tight">Recents</div>
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted-foreground">No conversations yet</div>
              )}
              <ul>
                {filtered.map((c) => (
                  <ChatRow
                    key={c.id}
                    c={c}
                    active={activeId === c.id}
                    menuOpen={menuFor === c.id}
                    renaming={renamingId === c.id}
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    onOpenMenu={() => setMenuFor(c.id)}
                    onCloseMenu={() => setMenuFor(null)}
                    onSelect={() => {
                      onSelect(c.id);
                      onToggle();
                    }}
                    onStartRename={() => {
                      setRenamingId(c.id);
                      setRenameValue(c.title);
                      setMenuFor(null);
                    }}
                    onCommitRename={(v) => {
                      onRename(c.id, v.trim() || c.title);
                      setRenamingId(null);
                    }}
                    onCancelRename={() => setRenamingId(null)}
                    onTogglePin={() => {
                      onTogglePin(c.id);
                      setMenuFor(null);
                    }}
                    onToggleArchive={() => {
                      onToggleArchive(c.id);
                      setMenuFor(null);
                    }}
                    onDelete={() => {
                      onDelete(c.id);
                      setMenuFor(null);
                    }}
                  />
                ))}
              </ul>
            </div>
            <button
              onClick={() => {
                onNew();
                onToggle();
              }}
              className="absolute bottom-6 right-5 inline-flex items-center gap-2.5 rounded-full bg-foreground px-5 py-3.5 text-background shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)] transition hover:opacity-90 active:scale-[0.98]"
            >
              <SquarePen size={18} strokeWidth={2} />
              <span className="text-[15px] font-medium">Chat</span>
            </button>
          </>
        )}

        {view === "projects" && (
          <ProjectsPanel projects={projects} onNewProject={() => setShowNewProject(true)} />
        )}

        {view === "images" && <ImagesPanel images={allImages} onOpen={(id) => { onSelect(id); onToggle(); setView("home"); }} />}

        {showNewProject && (
          <NewProjectModal
            onClose={() => setShowNewProject(false)}
            onCreate={(p) => {
              onCreateProject(p);
              setShowNewProject(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function QuickItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[17px] transition hover:bg-[oklch(0.97_0_0)]"
    >
      <span className="grid h-7 w-7 place-items-center text-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  );
}

function ChatRow({
  c,
  active,
  menuOpen,
  renaming,
  renameValue,
  setRenameValue,
  onOpenMenu,
  onCloseMenu,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: {
  c: Conversation;
  active: boolean;
  menuOpen: boolean;
  renaming: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (v: string) => void;
  onCancelRename: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const startPress = () => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onOpenMenu();
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <li className="group relative">
      {renaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={() => onCommitRename(renameValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename(renameValue);
            if (e.key === "Escape") onCancelRename();
          }}
          className="w-full rounded-2xl border border-foreground/30 bg-background px-3 py-3 text-[15px] outline-none"
        />
      ) : (
        <button
          onClick={() => {
            if (longPressed.current) return;
            onSelect();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenMenu();
          }}
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          className={`flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-[15px] transition ${
            active ? "bg-[oklch(0.96_0_0)]" : "hover:bg-[oklch(0.97_0_0)]"
          }`}
        >
          {c.pinned && <Pin size={13} className="shrink-0 fill-foreground text-foreground" />}
          <span className="truncate flex-1">{c.title || "New chat"}</span>
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (menuOpen) onCloseMenu();
          else onOpenMenu();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label="More"
      >
        <MoreHorizontal size={16} />
      </button>

      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-[0_22px_60px_-12px_rgba(0,0,0,0.28)]"
        >
          <MenuItem icon={<Pin size={17} />} label={c.pinned ? "Unpin" : "Pin"} onClick={onTogglePin} />
          <MenuItem icon={<Pencil size={17} />} label="Rename" onClick={onStartRename} />
          <MenuItem icon={<Archive size={17} />} label={c.archived ? "Unarchive" : "Archive"} onClick={onToggleArchive} />
          <MenuItem icon={<Trash2 size={17} />} label="Delete" onClick={onDelete} danger />
        </div>
      )}
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition hover:bg-[oklch(0.96_0_0)] ${
        danger ? "text-[oklch(0.55_0.22_25)]" : "text-foreground"
      }`}
    >
      <span className="grid h-5 w-5 place-items-center">{icon}</span>
      {label}
    </button>
  );
}

function ProjectsPanel({ projects, onNewProject }: { projects: Project[]; onNewProject: () => void }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[oklch(0.96_0_0)]">
          <Folder size={24} strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 text-[22px] font-semibold tracking-tight">Start your first project</h3>
        <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">
          Projects help you organize chats, files, and tools in one place
        </p>
        <button
          onClick={onNewProject}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[15px] font-medium text-background shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)] transition hover:opacity-90 active:scale-[0.98]"
        >
          New project
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
      <ul className="space-y-2">
        {projects.map((p) => {
          const Icon = resolveProjectIcon(p.icon);
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 transition hover:bg-[oklch(0.98_0_0)]"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-foreground"
                style={{ background: p.color }}
              >
                <Icon size={20} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">{p.name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </li>
          );
        })}
      </ul>
      <button
        onClick={onNewProject}
        className="absolute bottom-6 right-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-background shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)] transition hover:opacity-90 active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.25} />
        <span className="text-[15px] font-medium">New project</span>
      </button>
    </div>
  );
}

function ImagesPanel({
  images,
  onOpen,
}: {
  images: { dataUrl: string; name: string; convoId: string; title: string }[];
  onOpen: (convoId: string) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[oklch(0.96_0_0)]">
          <ImageIcon size={24} strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 text-[22px] font-semibold tracking-tight">No images yet</h3>
        <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">
          Every image you share with HalaGPT shows up here
        </p>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto px-3 pt-2 pb-24">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(img.convoId)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-[oklch(0.97_0_0)]"
          >
            <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover transition group-hover:scale-105" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-1.5">
              <div className="truncate text-[10px] font-medium text-white">{img.title}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const PROJECT_ICONS: Record<string, LucideIcon> = {
  homework: BookOpen,
  investing: TrendingUp,
  writing: Feather,
  travel: Plane,
  fitness: Dumbbell,
  work: Briefcase,
  health: Heart,
  code: Code2,
  design: Palette,
  study: GraduationCap,
  sparkle: Sparkles,
};

function resolveProjectIcon(key?: string): LucideIcon {
  if (key && PROJECT_ICONS[key]) return PROJECT_ICONS[key];
  return Folder;
}

const PROJECT_PRESETS: { name: string; icon: string; color: string }[] = [
  { name: "Homework", icon: "homework", color: "oklch(0.95 0.04 250)" },
  { name: "Investing", icon: "investing", color: "oklch(0.94 0.08 145)" },
  { name: "Writing", icon: "writing", color: "oklch(0.93 0.07 300)" },
  { name: "Travel", icon: "travel", color: "oklch(0.94 0.06 220)" },
  { name: "Fitness", icon: "fitness", color: "oklch(0.94 0.07 30)" },
  { name: "Work", icon: "work", color: "oklch(0.95 0.03 90)" },
  { name: "Health", icon: "health", color: "oklch(0.93 0.07 15)" },
  { name: "Code", icon: "code", color: "oklch(0.94 0.05 180)" },
  { name: "Design", icon: "design", color: "oklch(0.93 0.08 330)" },
  { name: "Study", icon: "study", color: "oklch(0.94 0.05 60)" },
];

const ICON_CHOICES: { key: string; label: string }[] = [
  { key: "sparkle", label: "Sparkle" },
  { key: "homework", label: "Book" },
  { key: "investing", label: "Trend" },
  { key: "writing", label: "Pen" },
  { key: "travel", label: "Travel" },
  { key: "fitness", label: "Fitness" },
  { key: "work", label: "Work" },
  { key: "health", label: "Health" },
  { key: "code", label: "Code" },
  { key: "design", label: "Design" },
  { key: "study", label: "Study" },
];

function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: Omit<Project, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("sparkle");
  const [color, setColor] = useState("oklch(0.95 0 0)");
  const IconCmp = resolveProjectIcon(icon);

  const create = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), icon, color });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="grid grid-cols-3 items-center px-4 pt-6 pb-4">
        <button
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-foreground transition hover:bg-[oklch(0.93_0_0)]"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h2 className="text-center text-[20px] font-semibold tracking-tight">New Project</h2>
        <span />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-[oklch(0.96_0_0)] px-3 py-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-foreground"
            style={{ background: color }}
          >
            <IconCmp size={20} strokeWidth={1.9} />
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-6 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">Icon</div>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {ICON_CHOICES.map((c) => {
            const I = resolveProjectIcon(c.key);
            const selected = c.key === icon;
            return (
              <button
                key={c.key}
                onClick={() => setIcon(c.key)}
                className={`grid aspect-square place-items-center rounded-2xl border transition ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-[oklch(0.97_0_0)]"
                }`}
                aria-label={c.label}
              >
                <I size={20} strokeWidth={1.9} />
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">Presets</div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {PROJECT_PRESETS.map((p) => {
            const I = resolveProjectIcon(p.icon);
            return (
              <button
                key={p.name}
                onClick={() => {
                  setName(p.name);
                  setIcon(p.icon);
                  setColor(p.color);
                }}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-[14px] font-medium transition hover:bg-[oklch(0.97_0_0)]"
              >
                <I size={15} strokeWidth={2} />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-8 pt-2">
        <button
          onClick={create}
          disabled={!name.trim()}
          className="w-full rounded-full bg-foreground px-6 py-4 text-[16px] font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[oklch(0.93_0_0)] disabled:text-muted-foreground"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}
