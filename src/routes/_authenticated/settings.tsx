import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Smile,
  NotebookPen,
  LayoutGrid,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Mail,
  UserCheck,
  Sun,
  Palette,
  Settings as Cog,
  Mic,
  Database,
  Lock,
  Bug,
  Info,
  LogOut,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — HalaGPT" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [appearance, setAppearance] = useState("System (Default)");
  const [accent, setAccent] = useState("Default");

  useEffect(() => auth.onAuthStateChanged((u) => setUser(u)), []);

  const initials = (user?.displayName || user?.email || "?")
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const logOut = async () => {
    await signOut(auth);
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const notImpl = () => toast("Coming soon", { description: "This area is being prepared." });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 pb-12">
        {/* Header */}
        <div className="relative flex flex-col items-center pt-5">
          <button
            onClick={() => navigate({ to: "/chat" })}
            className="absolute left-0 top-5 grid h-10 w-10 place-items-center rounded-full bg-[oklch(0.96_0_0)] transition hover:bg-[oklch(0.93_0_0)]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="relative">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-24 w-24 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-[oklch(0.55_0.13_180)] text-3xl font-semibold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={notImpl}
              className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border border-border bg-background shadow"
              aria-label="Edit"
            >
              <Pencil size={13} />
            </button>
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight" dir="auto">
            {user?.displayName || user?.email?.split("@")[0] || "User"}
          </h1>
        </div>

        {/* My HalaGPT */}
        <SectionTitle>My HalaGPT</SectionTitle>
        <Group>
          <Row icon={<Smile size={18} />} label="Personalization" onClick={notImpl} />
          <Row icon={<NotebookPen size={18} />} label="Memories" onClick={notImpl} />
          <Row icon={<LayoutGrid size={18} />} label="Apps" onClick={notImpl} />
        </Group>

        {/* Account */}
        <SectionTitle>Account</SectionTitle>
        <Group>
          <Row icon={<Briefcase size={18} />} label="Workspace" hint="Personal" onClick={notImpl} />
          <Row icon={<Sparkles size={18} />} label="Upgrade to Plus" onClick={notImpl} />
          <Row icon={<ShieldCheck size={18} />} label="Parental controls" onClick={notImpl} />
          <Row icon={<Mail size={18} />} label="Email" hint={user?.email ?? ""} onClick={notImpl} />
          <Row icon={<UserCheck size={18} />} label="Age verification" onClick={notImpl} />
        </Group>

        <Group className="mt-3">
          <DropdownRow icon={<Sun size={18} />} label="Appearance" value={appearance} options={["System (Default)", "Light", "Dark"]} onChange={setAppearance} />
          <DropdownRow icon={<Palette size={18} />} label="Accent color" value={accent} options={["Default", "Blue", "Green", "Pink", "Orange"]} onChange={setAccent} dotColor />
        </Group>

        {/* App */}
        <Group className="mt-3">
          <Row icon={<Cog size={18} />} label="General" onClick={notImpl} />
          <Row icon={<Mic size={18} />} label="Voice" onClick={notImpl} />
          <Row icon={<Database size={18} />} label="Data controls" onClick={notImpl} />
          <Row icon={<Lock size={18} />} label="Security" onClick={notImpl} />
          <Row icon={<Bug size={18} />} label="Report bug" onClick={notImpl} />
          <Row icon={<Info size={18} />} label="About" onClick={notImpl} />
        </Group>

        {/* Logout */}
        <Group className="mt-3">
          <button
            onClick={logOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium text-[oklch(0.55_0.22_25)] transition hover:bg-[oklch(0.97_0_0)]"
          >
            <LogOut size={18} />
            Log out
          </button>
        </Group>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 px-2 pb-2 text-[13px] font-medium text-muted-foreground">{children}</div>;
}

function Group({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-2xl bg-[oklch(0.96_0_0)] ${className}`}>{children}</div>;
}

function Row({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[oklch(0.94_0_0)]"
    >
      <span className="grid h-7 w-7 place-items-center text-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-foreground">{label}</div>
        {hint && <div className="truncate text-[12.5px] text-muted-foreground">{hint}</div>}
      </div>
    </button>
  );
}

function DropdownRow({
  icon, label, value, options, onChange, dotColor,
}: {
  icon: React.ReactNode; label: string; value: string; options: string[]; onChange: (v: string) => void; dotColor?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[oklch(0.94_0_0)]"
      >
        <span className="grid h-7 w-7 place-items-center text-foreground">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium text-foreground">{label}</div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            {dotColor && <span className="h-2 w-2 rounded-full bg-foreground/60" />}
            {value}
          </div>
        </div>
        <ChevronDown size={16} className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-background/60 bg-[oklch(0.94_0_0)] py-1">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`block w-full px-14 py-2 text-left text-[14px] transition hover:bg-[oklch(0.92_0_0)] ${o === value ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
