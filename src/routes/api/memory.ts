import { createFileRoute } from "@tanstack/react-router";
import { extractMemoryFacts } from "@/lib/halagpt.server";

type Body = { messages: { role: "user" | "assistant"; content: string }[] };

export const Route = createFileRoute("/api/memory")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!Array.isArray(body.messages)) {
            return new Response(JSON.stringify({ facts: [] }), {
              headers: { "Content-Type": "application/json" },
            });
          }
          const facts = await extractMemoryFacts(body.messages);
          return new Response(JSON.stringify({ facts }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ facts: [], error: message }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
