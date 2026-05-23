export type ChatImage = { dataUrl: string; name: string };

export type ChatAttachment = {
  url: string;        // public URL the AI can fetch (our own domain after upload)
  name: string;
  mime: string;       // e.g. image/png, application/pdf
  size?: number;      // bytes
  previewUrl?: string; // optional local preview (data URL) for instant render
  uploading?: boolean; // true while still uploading; filtered out before send
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ChatImage[];       // legacy / preview-only (deprecated)
  attachments?: ChatAttachment[];
  feedback?: "up" | "down" | null;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  projectId?: string | null;
};

export type Project = {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color: string;
  createdAt: number;
};
