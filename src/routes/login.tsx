import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, waitForAuthUser } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/chat",
  }),
  beforeLoad: async ({ search }) => {
    const user = await waitForAuthUser();
    if (user) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — HalaGPT" },
      { name: "description", content: "Sign in to HalaGPT." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google">(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate({ to: search.redirect });
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [navigate, search.redirect]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(prettyError(err));
      setLoading(null);
    }
  };

  const signInGoogle = async () => {
    setLoading("google");
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(prettyError(err));
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-white text-black">
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6">
        {/* HalaGPT title — slides DOWN from top into center */}
        <h1
          className="text-6xl font-semibold tracking-tight transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transitionDuration: "1400ms",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-90vh)",
          }}
        >
          HalaGPT
        </h1>

        <div className="h-10" />

        {/* Auth card — slides UP from bottom into center */}
        <div
          className="w-full transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transitionDuration: "1400ms",
            transitionDelay: "150ms",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(90vh)",
          }}
        >
          {/* Tabs */}
          <div className="mb-5 flex rounded-full border border-black/10 bg-black/[0.03] p-1 text-sm">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 rounded-full py-2 font-medium transition ${
                mode === "signin" ? "bg-black text-white shadow-sm" : "text-black/60 hover:text-black"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 rounded-full py-2 font-medium transition ${
                mode === "signup" ? "bg-black text-white shadow-sm" : "text-black/60 hover:text-black"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submitEmail} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3.5 text-[15px] text-black placeholder:text-black/40 outline-none transition focus:border-black/40"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Password"
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3.5 text-[15px] text-black placeholder:text-black/40 outline-none transition focus:border-black/40"
            />
            <button
              type="submit"
              disabled={loading !== null}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3.5 text-[15px] font-medium text-white transition active:scale-[0.99] hover:opacity-90 disabled:opacity-60"
            >
              {loading === "email"
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-black/40">
            <div className="h-px flex-1 bg-black/10" />
            or
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <button
            type="button"
            onClick={signInGoogle}
            disabled={loading !== null}
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-black/15 bg-white px-5 py-3.5 text-[15px] font-medium text-black transition active:scale-[0.99] hover:bg-black/[0.03] disabled:opacity-60"
          >
            <GoogleMark />
            {loading === "google" ? "Opening Google…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 rounded-xl border border-black/15 bg-black/[0.03] px-3 py-2 text-center text-xs text-black/70">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function prettyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  const map: Record<string, string> = {
    "auth/invalid-email": "That email looks invalid.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong password.",
    "auth/user-not-found": "No account for that email.",
    "auth/email-already-in-use": "An account already exists for that email.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Popup blocked — allow popups and try again.",
    "auth/network-request-failed": "Network error — check your connection.",
  };
  if (code && map[code]) return map[code];
  return err instanceof Error ? err.message : "Sign-in failed.";
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.8 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
