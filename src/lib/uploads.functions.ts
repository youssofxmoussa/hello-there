// Server functions that upload a user's attached file to Supabase storage
// and return a public URL that the external HalaGPT API can fetch.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UploadInput = z.object({
  dataUrl: z.string().min(8).max(40 * 1024 * 1024), // ~30MB cap on base64
  filename: z.string().min(1).max(200),
});

function dataUrlToBlob(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const b64 = match[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const uploadChatAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UploadInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { bytes, mime } = dataUrlToBlob(data.dataUrl);
    if (!ALLOWED.has(mime)) throw new Error(`Unsupported file type: ${mime}`);

    const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1] || "bin";
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-uploads")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: pub } = supabase.storage.from("chat-uploads").getPublicUrl(path);
    return { url: pub.publicUrl, mime, path };
  });
