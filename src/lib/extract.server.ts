// Server-only: turn any non-image attachment into plain text we can feed to the AI.
// Images stay as links (vision). PDFs are handled separately by pdfjs in chat.ts.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const TEXT_EXT = new Set([
  "txt","md","markdown","mdx","rst","log","csv","tsv","json","jsonl","ndjson","xml","yml","yaml","toml","ini","env","conf","cfg",
  "html","htm","css","scss","sass","less",
  "js","jsx","ts","tsx","mjs","cjs","vue","svelte","astro",
  "py","rb","go","rs","java","kt","kts","scala","swift","m","mm","c","h","cc","cpp","hpp","cs","php","pl","lua","r","jl","dart","ex","exs","erl","hs","clj","cljs","sh","bash","zsh","fish","ps1","bat","cmd","sql","graphql","gql","proto","tf","hcl","dockerfile","makefile","gradle","cmake","nim","zig","v","sol",
]);

const MAX_TEXT_PER_FILE = 60_000;

function extOf(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)(?:$|[?#])/);
  return m ? m[1] : "";
}

function basename(url: string) {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split("/").pop() || "file");
  } catch {
    return url.split("/").pop() || "file";
  }
}

function clip(s: string, n = MAX_TEXT_PER_FILE) {
  return s.length > n ? s.slice(0, n) + `\n…[truncated ${s.length - n} chars]` : s;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocument({ data: bytes }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= Math.min(pdf.numPages, 30); p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((i) => ("str" in i ? i.str : "")).join(" "));
  }
  return pages.join("\n\n");
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = Buffer.from(bytes);
  const r = await mammoth.extractRawText({ buffer: buf });
  return r.value || "";
}

async function extractXlsx(bytes: Uint8Array): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(bytes, { type: "array" });
  const out: string[] = [];
  for (const name of wb.SheetNames) {
    out.push(`# Sheet: ${name}`);
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    out.push(csv);
  }
  return out.join("\n\n");
}

async function extractPptx(bytes: Uint8Array): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)/)?.[1] ?? 0);
      return na - nb;
    });
  const parts: string[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async("string");
    const texts = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((m) =>
      m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    );
    if (texts.length) parts.push(`# Slide ${i + 1}\n${texts.join("\n")}`);
  }
  return parts.join("\n\n");
}

async function extractZip(bytes: Uint8Array, name: string): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(bytes);
  const out: string[] = [`# Archive: ${name}`];
  const entries = Object.values(zip.files).filter((f) => !f.dir).slice(0, 30);
  for (const f of entries) {
    const ext = extOf(f.name);
    if (TEXT_EXT.has(ext)) {
      const t = await f.async("string");
      out.push(`## ${f.name}\n\n${clip(t, 8000)}`);
    } else {
      out.push(`## ${f.name}  (binary, skipped)`);
    }
  }
  return out.join("\n\n");
}

export type ExtractedDoc = { name: string; text: string };

/**
 * Returns extracted text blocks for non-image attachments and the list of links
 * that should still be forwarded as vision links (images only).
 */
export async function extractAttachments(links: string[]): Promise<{ docs: ExtractedDoc[]; visionLinks: string[] }> {
  const docs: ExtractedDoc[] = [];
  const visionLinks: string[] = [];
  for (const link of links.slice(0, 10)) {
    const name = basename(link);
    const ext = extOf(name);
    // Images go straight to vision.
    if (/\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)(?:$|[?#])/i.test(link)) {
      visionLinks.push(link);
      continue;
    }
    try {
      const res = await fetch(link);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      let text = "";
      if (ext === "pdf") text = await extractPdf(buf);
      else if (ext === "docx") text = await extractDocx(buf);
      else if (ext === "xlsx" || ext === "xls") text = await extractXlsx(buf);
      else if (ext === "pptx") text = await extractPptx(buf);
      else if (ext === "zip") text = await extractZip(buf, name);
      else if (TEXT_EXT.has(ext) || !ext) {
        text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      } else {
        // Unknown binary — try as UTF-8 anyway, often code without extension.
        text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
        if (/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 2000))) text = "";
      }
      const clean = (text || "").trim();
      if (clean.length > 5) docs.push({ name, text: clip(clean) });
    } catch (err) {
      console.error("extract failed", link, err);
    }
  }
  return { docs, visionLinks };
}
