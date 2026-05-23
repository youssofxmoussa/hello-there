// Stream a file hosted on the temporary upstream (litterbox) through our own
// domain, so the public URL the AI receives looks like:
//   https://<ourdomain>/api/public/files/<b64>/<filename>
// The first path segment is base64url(catboxUrl); the trailing filename is
// cosmetic so the AI prompt shows a real filename.
import { createFileRoute } from "@tanstack/react-router";

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

export const Route = createFileRoute("/api/public/files/$")({
  server: {
    handlers: {
      HEAD: async ({ params }: { params: { _splat: string } }) => proxyFile(params, true),
      GET: async ({ params }: { params: { _splat: string } }) => {
        return proxyFile(params);
      },
    },
  },
});

async function proxyFile(params: { _splat: string }, head = false) {
  const splat = params._splat || "";
  const [enc] = splat.split("/");
  if (!enc) return new Response("Not found", { status: 404 });
  let upstream: string;
  try {
    upstream = b64urlDecode(enc);
  } catch {
    return new Response("Bad token", { status: 400 });
  }
  if (!/^https:\/\/litter\.catbox\.moe\/[a-zA-Z0-9._-]+$/.test(upstream)) {
    return new Response("Bad target", { status: 400 });
  }

  const res = await fetch(upstream, { method: head ? "HEAD" : "GET" });
  if (!res.ok) return new Response(`Upstream ${res.status}`, { status: 502 });

  const headers = new Headers();
  const ct = res.headers.get("content-type");
  const cl = res.headers.get("content-length");
  if (ct) headers.set("content-type", ct);
  if (cl) headers.set("content-length", cl);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("access-control-allow-origin", "*");
  return new Response(head ? null : res.body, { status: 200, headers });
}
