// NanoBanana Pro image generation — STUB.
// Wired end-to-end but intentionally disabled until the real API key is provided.
// When the user supplies their token, set NANOBANANA_API_BASE in env and flip
// ENABLED to true (or read it from process.env.NANOBANANA_ENABLED).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ENABLED = false; // flip to true when YOUR_API is configured
const API_BASE = "YOUR_API"; // e.g. "http://de3.bot-hosting.net:21007/kilwa-nanobanana-pro"
const EDIT_BASE = "YOUR_API"; // e.g. "http://de3.bot-hosting.net:21007/kilwa-nanobanana-edit"

const QUOTA_MIN_HOURS = 13;
const QUOTA_MAX_HOURS = 17;

// In a future migration: a generated_images table per user with created_at.
// For now we no-op since generation is disabled.

const GenInput = z.object({
  prompt: z.string().min(1).max(2000),
  editImageUrl: z.string().url().optional(),
});

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => GenInput.parse(input))
  .handler(async ({ data, context }) => {
    if (!ENABLED) {
      // Friendly "I can't" — same vibe as ChatGPT when a tool is unavailable.
      throw new Error(
        "Image generation is not available yet on this beta. The image studio will be enabled in a future update.",
      );
    }

    const url = data.editImageUrl
      ? `${EDIT_BASE}?text=${encodeURIComponent(data.prompt)}&img=${encodeURIComponent(data.editImageUrl)}`
      : `${API_BASE}?text=${encodeURIComponent(data.prompt)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image API ${res.status}`);
    const json = (await res.json()) as { status?: string; image_url?: string };
    if (json.status !== "success" || !json.image_url) throw new Error("Image generation failed");

    // Persist into chat-images bucket so it survives forever in the user's sidebar.
    const remote = await fetch(json.image_url);
    if (!remote.ok) throw new Error("Failed to fetch generated image");
    const bytes = new Uint8Array(await remote.arrayBuffer());
    const path = `${context.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const { error } = await supabaseAdmin.storage
      .from("chat-images")
      .upload(path, bytes, { contentType: "image/png" });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("chat-images").getPublicUrl(path);
    return { url: pub.publicUrl, quotaHours: QUOTA_MIN_HOURS + Math.random() * (QUOTA_MAX_HOURS - QUOTA_MIN_HOURS) };
  });
