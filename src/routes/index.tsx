import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  Code2,
  Sparkles,
  Globe,
  Brain,
  ShieldCheck,
  Languages,
  MessageSquare,
  Zap,
} from "lucide-react";
import logoUrl from "@/assets/halagpt-logo.png";
import { waitForAuthUser } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForAuthUser();
    if (user) throw redirect({ to: "/chat" });
  },
  component: Home,
  head: () => ({
    meta: [
      { title: "Hala AI — Palestinian AI assistant" },
      {
        name: "description",
        content:
          "Hala is a Palestinian AI assistant. Chat, vision & OCR, web search, code, and deep reasoning — in any language.",
      },
      { property: "og:title", content: "Hala AI" },
      {
        property: "og:description",
        content: "A Palestinian AI assistant — refined, fast, multilingual.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Hala AI",
          url: "/",
          logo: "/halagpt-logo.png",
          description: "Hala is a Palestinian AI from Palestine.",
        }),
      },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoUrl} alt="" className="h-7 w-7" />
            <span className="text-lg font-semibold tracking-tight">HalaGPT</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            Start chat <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, oklch(0.97 0 0) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-5 pt-24 pb-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Made with love in Palestine
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Meet <span className="italic">Hala</span> — a Palestinian AI,
            <br className="hidden md:block" /> built for everyone.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Chat, search the web, read text from images, write code, reason
            deeply — in any language. Refined, fast, and yours.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[15px] font-medium text-background shadow-[0_18px_45px_-15px_rgba(0,0,0,0.5)] transition hover:opacity-90 active:scale-[0.98]"
            >
              Start chat <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-[15px] font-medium text-foreground transition hover:bg-[oklch(0.97_0_0)]"
            >
              See what she can do
            </a>
          </div>
        </div>

        {/* Chat preview mockup */}
        <div className="relative mx-auto mt-4 max-w-5xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-background shadow-[0_60px_120px_-40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-border/60 bg-[oklch(0.985_0_0)] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0_0)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0_0)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0_0)]" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <img src={logoUrl} alt="" className="h-4 w-4" />
                hala.ai / chat
              </div>
              <div className="w-10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
              <aside className="hidden border-r border-border/60 bg-[oklch(0.985_0_0)] p-3 md:block">
                <div className="rounded-full bg-foreground px-3 py-2 text-center text-xs font-medium text-background">+ New chat</div>
                <div className="mt-4 space-y-1.5">
                  {["Trip plan to Petra", "Summarize this PDF", "React vs Vue", "Translate to Arabic", "OCR receipt"].map((t) => (
                    <div key={t} className="truncate rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-background">
                      {t}
                    </div>
                  ))}
                </div>
              </aside>
              <div className="space-y-5 p-6 text-left">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-foreground px-4 py-2.5 text-sm text-background">
                    Plan a 3-day trip to Petra for 2 people on a small budget.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <img src={logoUrl} alt="" className="h-7 w-7 rounded-full border border-border" />
                  <div className="max-w-[80%] space-y-2 rounded-2xl rounded-tl-md border border-border bg-[oklch(0.985_0_0)] px-4 py-3 text-sm text-foreground">
                    <p className="font-medium">Here's a refined 3-day Petra plan ✦</p>
                    <ul className="ml-4 list-disc space-y-1 text-[13px] text-muted-foreground">
                      <li><b className="text-foreground">Day 1</b> — Visitor center → Siq → Treasury at golden hour.</li>
                      <li><b className="text-foreground">Day 2</b> — Monastery hike (800 steps) → Royal tombs.</li>
                      <li><b className="text-foreground">Day 3</b> — Little Petra + Wadi Rum jeep tour.</li>
                    </ul>
                    <p className="text-[13px] text-muted-foreground">Est. budget: ~$220 / person incl. 2-day pass.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-foreground px-4 py-2.5 text-sm text-background">
                    اقرأ هذي الفاتورة بالعربي 📷
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <img src={logoUrl} alt="" className="h-7 w-7 rounded-full border border-border" />
                  <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-border bg-[oklch(0.985_0_0)] px-4 py-3 text-sm" dir="rtl">
                    تمام — قرأت الفاتورة. المجموع <b>JD 42.50</b>، تتضمن ضريبة <b>16%</b>. أكبر بند: عشاء <b>JD 18.00</b>.
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-muted-foreground">+</span>
                  <span className="flex-1 text-sm text-muted-foreground">Message Hala…</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background">↑</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            One assistant. Everything you need.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Hala combines reasoning, vision, search, and code into a single
            calm interface. No clutter, no menus to learn.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Brain size={20} />}
            title="Deep reasoning"
            body="Step-by-step thinking on demand for hard problems — math, logic, long documents, plans."
          />
          <Feature
            icon={<Eye size={20} />}
            title="Vision & OCR"
            body="Read text from any image — handwriting, screenshots, receipts. Translate and summarize."
          />
          <Feature
            icon={<Globe size={20} />}
            title="Live web search"
            body="Pull current answers from the web with sources you can verify."
          />
          <Feature
            icon={<Code2 size={20} />}
            title="Code that runs"
            body="Write, debug and explain code in 40+ languages with copyable code blocks."
          />
          <Feature
            icon={<Languages size={20} />}
            title="Truly multilingual"
            body="Speak any language. Arabic and other RTL scripts render natively, right-to-left."
          />
          <Feature
            icon={<ShieldCheck size={20} />}
            title="Private by design"
            body="Server-verified sessions, encrypted at rest, no training on your conversations."
          />
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t border-border/60 bg-[oklch(0.985_0_0)]"
      >
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Simple pricing. Half of the other guy.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <PriceCard
              name="Free"
              price="$0"
              note="forever"
              features={[
                "Standard chat",
                "Limited images per day",
                "Limited web search",
                "Markdown & code blocks",
              ]}
            />
            <PriceCard
              name="Plus"
              price="$10"
              note="per month"
              featured
              features={[
                "Everything in Free",
                "Higher message limits",
                "Deep reasoning",
                "More images & OCR",
                "Priority response speed",
              ]}
            />
            <PriceCard
              name="Pro"
              price="$20"
              note="per month"
              features={[
                "Everything in Plus",
                "Near-unlimited usage",
                "Largest context",
                "Early access to new models",
              ]}
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          A small AI with a big home.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Hala is built in Palestine, for anyone in the world. We believe great
          AI should feel warm, honest, and useful — not loud, not pushy.
          That&apos;s what we&apos;re building.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[15px] font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
          >
            Say hi to Hala <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-5 py-24">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Questions, answered.
          </h2>
          <div className="mt-10 space-y-2">
            <Faq q="Is HalaGPT free?" a="Yes. The free tier covers most everyday questions, with limits on advanced features." />
            <Faq q="What languages does Hala speak?" a="Any. Arabic, English, French, Spanish, Turkish, Urdu, Hebrew, Russian, Chinese, Hindi — and more. RTL languages render right-to-left automatically." />
            <Faq q="Can Hala read text from images?" a="Yes. Upload a photo, screenshot, or scan — Hala extracts the text, translates, or summarizes it." />
            <Faq q="Are my chats private?" a="Your conversations stay yours. Sessions are server-verified, data is encrypted, and we don't train on your chats." />
            <Faq q="Why is it cheaper than other assistants?" a="Because it should be. Plus is $10/month — half the typical price — without giving up quality." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="" className="h-5 w-5" />
            <span>HalaGPT — Palestinian AI from Palestine.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/chat" className="hover:text-foreground">Chat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-3xl border border-border bg-background p-6 transition hover:bg-[oklch(0.98_0_0)]">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[oklch(0.96_0_0)] text-foreground transition group-hover:bg-foreground group-hover:text-background">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function PriceCard({
  name,
  price,
  note,
  features,
  featured,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl border p-7 ${
        featured
          ? "border-foreground bg-foreground text-background shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)]"
          : "border-border bg-background text-foreground"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-background px-3 py-1 text-[11px] font-semibold text-foreground shadow">
          <Sparkles size={11} /> Most popular
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
        <Zap
          size={16}
          className={featured ? "text-background/70" : "text-muted-foreground"}
        />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold tracking-tight">{price}</span>
        <span className={featured ? "text-background/70" : "text-muted-foreground"}>
          /{note.replace("per ", "")}
        </span>
      </div>
      <ul className="mt-6 space-y-2.5 text-[15px]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <MessageSquare size={14} className="mt-1 shrink-0 opacity-70" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/chat"
        className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium transition ${
          featured
            ? "bg-background text-foreground hover:opacity-90"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        Get started <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-background px-5 py-4 open:bg-[oklch(0.985_0_0)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium">
        {q}
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[oklch(0.96_0_0)] text-foreground transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{a}</p>
    </details>
  );
}
