import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { halaChat, type HalaMsg } from "@/lib/halagpt.server";
import { extractAttachments } from "@/lib/extract.server";

type IncomingMsg = {
  role: "user" | "assistant" | "system";
  content: string;
  links?: string[];
};
type ChatBody = { messages: IncomingMsg[]; deepThink?: boolean; memory?: string[] };

async function processMessage(m: IncomingMsg): Promise<HalaMsg> {
  if (!m.links || m.links.length === 0) {
    return { role: m.role, content: m.content };
  }
  const { docs, visionLinks } = await extractAttachments(m.links);
  let content = m.content;
  if (docs.length > 0) {
    const header = `\n\n[The user attached ${docs.length} file${docs.length > 1 ? "s" : ""}. Read each one carefully and use it in your answer.]`;
    const blocks = docs
      .map((d) => `\n\n[Attached file: ${d.name}]\n\`\`\`\n${d.text}\n\`\`\``)
      .join("");
    content = `${content}${header}${blocks}`;
  }
  return { role: m.role, content, links: visionLinks };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as ChatBody;
          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const msgs: HalaMsg[] = await Promise.all(body.messages.map(processMessage));
          const content = await halaChat(msgs, { deepThink: !!body.deepThink, memory: body.memory });
          return new Response(JSON.stringify({ content }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
