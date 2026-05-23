// Official-style file icon: document with folded corner + colored ribbon
// at the bottom showing the file type label. Matches the polish of native
// file pickers and ChatGPT's attachment chips.

type Spec = { color: string; label: string };

const MAP: Record<string, Spec> = {
  // Code
  py: { color: "#3776AB", label: "PY" },
  js: { color: "#F7DF1E", label: "JS" },
  mjs: { color: "#F7DF1E", label: "JS" },
  cjs: { color: "#F7DF1E", label: "JS" },
  ts: { color: "#3178C6", label: "TS" },
  tsx: { color: "#3178C6", label: "TSX" },
  jsx: { color: "#61DAFB", label: "JSX" },
  html: { color: "#E34F26", label: "HTML" },
  css: { color: "#1572B6", label: "CSS" },
  scss: { color: "#CC6699", label: "SCSS" },
  json: { color: "#292929", label: "JSON" },
  xml: { color: "#0060AC", label: "XML" },
  yml: { color: "#CB171E", label: "YML" },
  yaml: { color: "#CB171E", label: "YML" },
  md: { color: "#292929", label: "MD" },
  sh: { color: "#4EAA25", label: "SH" },
  bash: { color: "#4EAA25", label: "BASH" },
  go: { color: "#00ADD8", label: "GO" },
  rs: { color: "#DEA584", label: "RS" },
  java: { color: "#B07219", label: "JAVA" },
  kt: { color: "#A97BFF", label: "KT" },
  swift: { color: "#FA7343", label: "SWIFT" },
  c: { color: "#555555", label: "C" },
  cpp: { color: "#00599C", label: "C++" },
  cs: { color: "#239120", label: "C#" },
  php: { color: "#777BB4", label: "PHP" },
  rb: { color: "#CC342D", label: "RB" },
  lua: { color: "#000080", label: "LUA" },
  sql: { color: "#E48E00", label: "SQL" },
  r: { color: "#276DC3", label: "R" },
  dart: { color: "#00B4AB", label: "DART" },
  // Docs
  pdf: { color: "#E5252A", label: "PDF" },
  doc: { color: "#2B579A", label: "DOC" },
  docx: { color: "#2B579A", label: "DOC" },
  xls: { color: "#1D6F42", label: "XLS" },
  xlsx: { color: "#1D6F42", label: "XLS" },
  csv: { color: "#1D6F42", label: "CSV" },
  ppt: { color: "#D24726", label: "PPT" },
  pptx: { color: "#D24726", label: "PPT" },
  txt: { color: "#6B7280", label: "TXT" },
  rtf: { color: "#6B7280", label: "RTF" },
  // Media
  mp3: { color: "#7C3AED", label: "MP3" },
  wav: { color: "#7C3AED", label: "WAV" },
  m4a: { color: "#7C3AED", label: "M4A" },
  ogg: { color: "#7C3AED", label: "OGG" },
  flac: { color: "#7C3AED", label: "FLAC" },
  mp4: { color: "#EC4899", label: "MP4" },
  mov: { color: "#EC4899", label: "MOV" },
  webm: { color: "#EC4899", label: "WEBM" },
  mkv: { color: "#EC4899", label: "MKV" },
  avi: { color: "#EC4899", label: "AVI" },
  // Archives
  zip: { color: "#EAB308", label: "ZIP" },
  rar: { color: "#EAB308", label: "RAR" },
  "7z": { color: "#EAB308", label: "7Z" },
  tar: { color: "#EAB308", label: "TAR" },
  gz: { color: "#EAB308", label: "GZ" },
  // Images
  png: { color: "#06B6D4", label: "PNG" },
  jpg: { color: "#06B6D4", label: "JPG" },
  jpeg: { color: "#06B6D4", label: "JPG" },
  webp: { color: "#06B6D4", label: "WEBP" },
  gif: { color: "#06B6D4", label: "GIF" },
  svg: { color: "#FFB13B", label: "SVG" },
  heic: { color: "#06B6D4", label: "HEIC" },
  // Fonts
  ttf: { color: "#1f2937", label: "TTF" },
  otf: { color: "#1f2937", label: "OTF" },
  woff: { color: "#1f2937", label: "WOFF" },
  woff2: { color: "#1f2937", label: "WOFF" },
};

export function getFileSpec(name: string, mime?: string): Spec {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (MAP[ext]) return MAP[ext];
  if (mime?.startsWith("image/")) return { color: "#06B6D4", label: "IMG" };
  if (mime?.startsWith("video/")) return { color: "#EC4899", label: "VIDEO" };
  if (mime?.startsWith("audio/")) return { color: "#7C3AED", label: "AUDIO" };
  if (mime === "application/pdf") return MAP.pdf;
  return { color: "#6B7280", label: ext.slice(0, 4).toUpperCase() || "FILE" };
}

export function formatBytes(n?: number): string {
  if (!n || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Glossy document-with-folded-corner icon, with colored bottom ribbon. */
export function FileGlyph({ name, mime, size = 44 }: { name: string; mime?: string; size?: number }) {
  const spec = getFileSpec(name, mime);
  const w = size;
  const h = Math.round(size * 1.22);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 44 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
    >
      <defs>
        <linearGradient id={`fg-${spec.label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f4f6" />
        </linearGradient>
      </defs>
      {/* Page */}
      <path
        d="M4 2 H30 L42 14 V50 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 V4 a2 2 0 0 1 2 -2 Z"
        fill={`url(#fg-${spec.label})`}
        stroke="#d1d5db"
        strokeWidth="1"
      />
      {/* Folded corner */}
      <path d="M30 2 L42 14 H32 a2 2 0 0 1 -2 -2 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
      {/* Colored ribbon */}
      <rect x="2" y="34" width="40" height="14" rx="2" fill={spec.color} />
      <text
        x="22"
        y="44.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize={spec.label.length > 4 ? 7 : spec.label.length > 3 ? 8 : 9}
        fontWeight="800"
        fill="#ffffff"
        letterSpacing="0.3"
      >
        {spec.label}
      </text>
    </svg>
  );
}

export function FileBadge({ name, mime, size }: { name: string; mime?: string; size?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 shadow-sm">
      <FileGlyph name={name} mime={mime} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{name}</div>
        <div className="text-[11px] text-muted-foreground">{formatBytes(size)}</div>
      </div>
    </div>
  );
}
