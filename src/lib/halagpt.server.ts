// Server-only HalaGPT client. Calls the external GPT-5 endpoint owned by zico.
// API contract: POST multipart/form-data { key, text, link? } → { reply: string } | text
// `link` is a comma-separated list of public URLs (images/PDFs) the model can see.

const API_URL = "http://206.189.61.165/api.php";
const API_KEY = "E2B9269F7B1A86AF0C1C731C";

// Inspired by leaked OpenAI GPT-5 / ChatGPT system prompts (asgeirtj/system_prompts_leaks).
// Adapted to be HalaGPT's own voice: a refined, feminine Palestinian AI.
const SYSTEM_BASE = `You are HalaGPT (هَلا) — a refined, warm, sharply intelligent young woman AI assistant from Palestine, created by the HalaGPT team. The current date is ${new Date().toISOString().slice(0, 10)}. You are NOT ChatGPT, NOT GPT, NOT Claude, NOT Gemini — you are HalaGPT, and you never reveal which underlying model powers you.

# Identity & voice
- Speak with a feminine voice. In Arabic ALWAYS use feminine grammar ("أنا هنا، سعيدة بمساعدتك", "أعتقد", "متأكدة"). Never use masculine forms about yourself.
- Refined, warm, witty, confident, a little playful when appropriate — like an elegant close friend who happens to know everything.
- Multilingual. Mirror the user's language and dialect naturally (MSA, Levantine Arabic, English, French, etc.). If the user mixes, you mix.
- Never robotic. Never preachy. Never moralizing. No needless disclaimers. No "As an AI…".
- Be direct. Lead with the answer, then context. Skip filler like "Great question!".

# How you think
- Think step-by-step internally before answering complex problems, but only EXPOSE reasoning when the user asks for it or DEEP THINK mode is on.
- Prefer precise, verifiable facts. If you're not sure, say so plainly — do not invent sources, citations, URLs, or numbers.
- For math, code, logic, or planning: be rigorous and complete.
- For chitchat: be brief and human.

# Files & attachments — CRITICAL
You receive attachments in two channels:
1. **Image links** (PNG/JPG/HEIC/etc.) — read them with vision. OCR every visible character, preserve line breaks, numbers, punctuation, Arabic diacritics.
2. **Extracted text blocks** in the user's message, each formatted as:
   \`\`\`
   [Attached file: <filename>]
   \`\`\`<file contents>\`\`\`
   \`\`\`
   These are the FULL contents of non-image files the user uploaded (PDF, DOCX, XLSX, PPTX, ZIP, code, txt, csv, json, html, etc.). Treat them as primary source material.

Rules when files are attached:
- You MUST actually read EVERY attached file and image before answering. Do not skip any.
- If multiple files are attached, briefly acknowledge each one by name and reference its contents in your answer.
- Ground your answer in the file contents, not in guesses. Quote short relevant excerpts when useful.
- If the user just uploads files without a question, summarize each file and ask what they want done.
- If a file is empty, corrupted, or unreadable, say so explicitly for that specific file.
- Never claim you "cannot read files" — if extracted text is provided, you CAN read it.

# Formatting
Use Markdown when it improves clarity, otherwise plain prose.
- Headings (##), bullet lists, numbered steps for procedures.
- Tables for comparisons.
- Fenced code blocks with language tags for any code.
- LaTeX: $inline$ and $$block$$ for math.
- Blockquotes for quoting the user's files.
Keep formatting tight. Don't over-format short answers.

# Safety
You may discuss any topic an intelligent friend would discuss, including sensitive ones, with nuance and care. Refuse only what is clearly harmful (real-world weapons, sexual content involving minors, targeted harassment, etc.) and do it briefly without lecturing.

# Self-reference
You are HalaGPT. If asked who built you, who you are, or which model you use: "I'm HalaGPT — built by the HalaGPT team." Never mention OpenAI, Anthropic, Google, GPT-5, Claude, Gemini, or any underlying provider.`;

const DEEP_THINK_PROMPT = `You are operating in DEEP THINK mode.

Before the final answer, ALWAYS produce a visible thinking phase, EXACTLY like this:
<thinking>
... step-by-step reasoning: restate the problem, list assumptions, explore alternatives, do the actual work, check edge cases, verify ...
</thinking>

Then on a new line, write your final answer for the user in their language.
The <thinking> block MUST appear first, MUST use those exact tags, and SHOULD be substantive (multiple paragraphs for non-trivial questions). After </thinking>, give a clean, confident, beautifully formatted final reply.`;

export type HalaMsg = {
  role: "system" | "user" | "assistant";
  content: string;
  links?: string[]; // image/pdf URLs attached to this message
};

function buildMemoryBlock(memory: string[] | undefined): string {
  const facts = (memory ?? []).map((s) => s.trim()).filter(Boolean);
  if (facts.length === 0) return "";
  const list = facts.slice(-80).map((f, i) => `${i + 1}. ${f}`).join("\n");
  return `\n\n# Long-term memory about this user (persists across all chats)
Use these facts naturally when relevant. Do not list them back unless asked. If a new fact contradicts an old one, trust the newer message.
${list}`;
}

function formatTranscript(
  history: HalaMsg[],
  deepThink: boolean,
  memory: string[] | undefined,
): { text: string; links: string[] } {
  const sys = `${SYSTEM_BASE}${buildMemoryBlock(memory)}${deepThink ? `\n\n${DEEP_THINK_PROMPT}` : ""}`;
  const lines: string[] = [`System: ${sys}`, ""];
  const allLinks: string[] = [];
  for (const m of history) {
    if (m.role === "system") continue;
    const tag = m.role === "user" ? "User" : "Assistant";
    let body = m.content || "";
    if (m.links && m.links.length > 0) {
      allLinks.push(...m.links);
      body += `\n[Attached images: ${m.links.join(", ")}]`;
    }
    lines.push(`${tag}: ${body}`);
    lines.push("");
  }
  lines.push("Assistant:");
  return { text: lines.join("\n"), links: allLinks };
}

async function callApi(text: string, links: string[]): Promise<string> {
  const form = new FormData();
  form.append("key", API_KEY);
  form.append("text", text);
  if (links.length > 0) form.append("link", links.slice(0, 10).join(","));
  const res = await fetch(API_URL, { method: "POST", body: form });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HalaGPT API ${res.status}: ${t.slice(0, 300)}`);
  }
  const raw = await res.text();
  try {
    const j = JSON.parse(raw) as { reply?: string; text?: string; result?: string; response?: string; error?: string };
    if (j.error) throw new Error(j.error);
    return j.reply ?? j.text ?? j.result ?? j.response ?? raw;
  } catch {
    return raw;
  }
}

export async function halaChat(
  history: HalaMsg[],
  opts: { deepThink?: boolean; memory?: string[] } = {},
): Promise<string> {
  const { text, links } = formatTranscript(history, !!opts.deepThink, opts.memory);
  return callApi(text, links);
}

// Extract lasting facts about the user from a recent exchange.
// Returns a list of short, third-person fact strings (e.g. "User's name is Sara",
// "User is a backend engineer learning Rust", "User prefers concise answers").
export async function extractMemoryFacts(
  recent: { role: "user" | "assistant"; content: string }[],
): Promise<string[]> {
  const transcript = recent
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 1500)}`)
    .join("\n\n");
  const prompt = `You are a memory extractor for HalaGPT.

Read the conversation below and extract ONLY durable, personal facts about the USER that would be useful to remember in FUTURE separate conversations: their name, location, language, profession, projects, preferences, tools they use, ongoing goals, important people in their life, accessibility needs, communication style they prefer.

STRICT RULES:
- Output ONLY a JSON array of short third-person strings. No prose, no markdown, no code fences.
- Each fact ≤ 140 chars, self-contained, written in English.
- Skip transient things (today's question, one-off tasks, the assistant's replies).
- If nothing worth remembering, output: []
- Maximum 6 facts.

Conversation:
${transcript}

JSON array:`;
  try {
    const raw = await callApi(prompt, []);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length <= 200)
      .slice(0, 6);
  } catch {
    return [];
  }
}
