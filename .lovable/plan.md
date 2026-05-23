# HalaGPT — Full Rebuild Plan

This is a from-zero rebuild. Two separate sites in one project:

1. `**/**` — Marketing/home (English, multilingual switcher, lots of content, "Start Chat" CTA → `/chat`)
2. `**/chat**` — The chat app (current HALA work, fully rebuilt)

Brand name everywhere: **HalaGPT** (Arabic: **حلا جي بي تي**). No "HALA GPT" / "HALA" / "هالة". No Lovable credits.

---

## 1. SEO & Identity

- Site title: `Hala AI`
- Meta description: `Hala is a Palestinian AI from Palestine.` (humanized, not keyword-stuffed)
- Per-route `head()` with unique title/description/og tags
- JSON-LD `Organization` + `WebSite`
- Single H1 per page, semantic HTML, alt text, canonical, sitemap, robots

---

## 2. Enable Lovable Cloud BUT  ULL TELL ME IF THIS WILL INFLUENCE ON VERCEL DEPLOYMENT LIKE ITLL APPEAR INSTEAD OF MY DOMAIN, LOVABLE DOMAIN 

Required for: Postgres (users, sessions, chats, subscriptions), auth, server-verified sessions, file storage, secrets. I'll enable it as step 1 of implementation.

---

## 3. Security Architecture (top priority)

Built around: **server-verified identity + secure cookie sessions + short-lived single-use tokens + strict rate limiting**.

### Auth model

- **Google Sign-In** via Google Identity Services — verify Google ID token **server-side** using `google-auth-library`; use `sub` as identity key (never email).
- **Email + Password** with email verification code (6-digit, 10-min TTL, single-use, hashed in DB).
- **Email magic-code login** (passwordless option per request).
- Argon2id password hashing (`argon2` npm).
- Common-password blocklist; NIST-style policy (length-based, no forced symbols, allow paste).

### Sessions

- **Server-side sessions** in Postgres, opaque session ID in cookie.
- Cookie: `__Host-hala_sid`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`.
- **Never** store tokens in `localStorage`.
- Rotate on privilege change; absolute + idle expiry.

### Hardening

- CSRF: double-submit token on all state-changing routes
- CSP, X-Frame-Options, Referrer-Policy, HSTS via response headers
- Rate limiting per-IP + per-account on `/login`, `/signup`, `/verify`, `/forgot` (Postgres-backed bucket)
- Generic responses on signup/forgot (no user enumeration), constant-ish timing
- All DB access through parameterized queries / Supabase client (no string SQL)
- Audit log table: login success/fail, verify, password change, Google link, subscription events — **no tokens, no passwords, no full verification URLs**

### DB schema

```
users(id, status[pending|active|locked], created_at, locale, plan, …)
auth_identities(id, user_id, provider[google|password], provider_subject, email_normalized, created_at)
email_verification_tokens(id, user_id, token_hash, expires_at, used_at)
password_reset_tokens(id, user_id, token_hash, expires_at, used_at)
sessions(id, user_id, created_at, last_seen, expires_at, ua, ip_hash)
rate_limits(key, window_start, count)
audit_logs(id, user_id, event, meta_json, created_at)
conversations(id, user_id, title, pinned, archived, project_id, created_at, updated_at)
messages(id, conversation_id, role, content, attachments_json, created_at)
projects(id, user_id, name, icon, color)
subscriptions(id, user_id, plan, status, period_end, binance_order_id)
usage_counters(user_id, period_start, images_used, deep_think_used, …)
```

All tables: RLS enabled, `user_id = auth.uid()` policies, `auth_identities` & token tables admin-only.

### Anonymous use

Like ChatGPT: text↔text works without login. Login required to **save history, upload images, subscribe**. Anonymous sessions are in-memory only.

---

## 4. Marketing Site (`/`)

- New route file `src/routes/index.tsx` (current chat moves to `/chat`)
- Sections: Hero, What is Hala, Features (vision/OCR, deep think, search, code, markdown), Pricing, FAQ, About Palestine origin, Footer
- Language switcher in sidebar/top — English default, RTL for Arabic, supports many languages (ar, en, fr, es, de, tr, ur, fa, he, ru, zh, hi, …) via simple i18n dictionary
- `Start Chat` CTA → `/chat`
- Lots of content for SEO

---

## 5. Chat App (`/chat`) — Refinements

### Top-right "New chat" button bug

Currently toggles temporary (black) mode — fix: dedicated "New chat" button (PenSquare icon) separate from the "Temporary" button.

### Sidebar

- **Resizable** (drag handle, like ChatGPT), persisted width
- Smooth open/close animation
- Account block at bottom — avatar + name, click → small popup (Settings, Subscription, Log out, Language)
- Chat row hover → small `⋯` button → menu (Rename, Delete, Archive, Pin) with same icons as user's reference images
- Search inside conversations: searches **message content**, not titles
- Auto-generated chat titles from the model, **typewritten** when sidebar open during first reply (only first time)
- Selecting an existing chat: fast auto-scroll to end, no retyping (already in place — verify)

### Composer

- `+` button opens a ChatGPT-style menu (NOT a file picker):
  - 🧠 Deep Think (toggle)
  - 🖼️ Images (upload)
  - 📎 Files (upload, incl. text/code files)
  - 🔍 Search (toggle — model decides when off, deep search when on) AS ICONS NOT EMOJIES, I WANT THE SAME ICONS AS CHATGPT USRS 
- Mic button → Web Speech API → transcribe to text, **send as text** but display as audio bubble with transcript below in smaller faded font
- File attachments: for text/code files (.py, .js, .ts, .md, .json, …) send `filename + size + full content` prepended to the user message
- Smooth animations on every menu/panel open

### RTL

- When message content is Arabic/Hebrew/etc., align that bubble to the right and use RTL direction (per-message detection)

### Markdown & code

- Full markdown (bold, headings, lists, tables, blockquote, LaTeX)
- Code blocks rendered as a "code bubble" with language label + copy button
- Already partially there via `Markdown.tsx` — extend

### Models & modes

- **Default**: Groq Llama 4 Scout (current) — auto-decides when to search
- **Deep Think**: separate API (e.g. Groq `deepseek-r1-distill-llama-70b` or `qwen-qwq-32b`) — always reasons
- **Search**: streamed search results shown inline during reasoning (Tavily or Brave Search API), deeper when Deep Think on
- Like/Dislike → animated toast notification (sonner)

### Image OCR fix

Current "something went wrong" likely from request size. Fix:

- Downscale images client-side before sending (max 1568px, JPEG 0.85)
- Server route validates payload <= 20MB
- Better error surfacing (show actual message)

---

## 6. Payments — Binance Pay

Use **Binance Pay merchant API** (not Stripe/Paddle, per user). Backend-only token, signed requests, webhook verification.

- Plans:
  - **Free** — limited messages/day, limited images, no Deep Think
  - **Plus — $10/mo** (half of ChatGPT) — high limits, Deep Think N times/day, more images
  - **Pro — $20/mo** — near-unlimited
- Server route `/api/public/binance/webhook` verifies HMAC signature, updates `subscriptions` & `usage_counters`
- Secrets: `BINANCE_PAY_API_KEY`, `BINANCE_PAY_SECRET` stored via secrets tool (user adds later)
- "Fiery" upgrade modal triggered on quota exhaustion (animated, gradient, urgent)
- Usage counters enforced server-side on every chat request

---

## 7. i18n

Lightweight in-house dictionary in `src/i18n/{en,ar,…}.ts`, hook `useT()`, `<html lang dir>` set by language. Sidebar setting persists to `users.locale`.

---

## 8. Implementation Order

1. Enable Lovable Cloud ( BUT ULL TELL ME IF THIS WILL INFLUENCE ON ME WHEN I DEPLOY VERCEL??) 
2. DB migrations (all tables + RLS)
3. Auth backend (server fns + middleware): Google verify, email+password, verification codes, sessions, CSRF, rate limit, audit
4. Auth UI: `/login`, `/signup`, `/verify`, `/reset-password`, account popup
5. Marketing home at `/` + i18n + language switcher
6. Move chat to `/chat` (anonymous allowed, login persists)
7. Sidebar rework: resizable, account block, row menu, content-search, auto-title typewriter, fix New-chat button
8. Composer rework: `+` menu, mic, file content embedding, smooth panels, RTL per-message
9. Image OCR fix + better errors + downscale
10. Deep Think + Search integration (separate API, streamed results)
11. Markdown code bubbles + like/dislike toasts
12. Binance Pay backend + upgrade modals + usage enforcement
13. Security headers, CSP, HSTS, audit-log dashboard (admin)
14. SEO polish (titles, JSON-LD, sitemap)
15. Remove every "HALA GPT" / "HALA" → "HalaGPT"

---

## Open questions before I start

1. **Google OAuth secret** — you uploaded the JSON. I'll store `GOOGLE_CLIENT_ID` (public, in code) and `GOOGLE_CLIENT_SECRET` via the secrets tool. Confirm the redirect URI you've registered in Google Cloud Console — I'll use `https://<your-domain>/api/auth/google/callback`. What domain should I register?
2. **Email sending** — Lovable Emails (built-in, needs a sender domain) OR a transactional provider? I recommend Lovable Emails — works out of the box once you connect a domain.
3. **Search API** — Tavily ($), Brave Search ($), or use the built-in `websearch` (Lovable AI Gateway)? Cheapest: built-in.
4. **Deep Think model** — Groq's `deepseek-r1-distill-llama-70b` (free tier, fast) OK?
5. **Binance Pay** — confirm you want Binance Pay Merchant API (requires merchant account). Subscriptions on Binance Pay are **manual renewals** (Binance doesn't do recurring); is that OK, or do you want a one-time-purchase-per-month model? This is a hard constraint.
6. **Anonymous limits** — how many messages/day for not-logged-in users? (ChatGPT-style: ~10)

This is a 2-3 day build. After your answers I'll start with security + auth foundation. + NO LOVABLE AI ULLUSE ANYTHING FROM GROQ