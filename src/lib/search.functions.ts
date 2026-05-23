// Free web search via DuckDuckGo Instant Answer API + Wikipedia fallback.
// No API key required. Returns text snippets + image URLs + related links
// so the chat UI can render ChatGPT-style "this is X: [image] [story]".
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(1).max(300),
});

type SearchResult = {
  title: string;
  summary: string;
  image?: string;
  url?: string;
  related: { title: string; url: string }[];
};

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((input) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<SearchResult> => {
    const q = encodeURIComponent(data.query);

    // DuckDuckGo Instant Answer — free, no key, includes Heading/AbstractText/Image/RelatedTopics.
    const ddgUrl = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1&t=halagpt`;
    let ddg: {
      Heading?: string;
      AbstractText?: string;
      Image?: string;
      AbstractURL?: string;
      RelatedTopics?: { Text?: string; FirstURL?: string }[];
    } = {};
    try {
      const r = await fetch(ddgUrl, { headers: { "User-Agent": "HalaGPT/1.0" } });
      if (r.ok) ddg = await r.json();
    } catch {
      /* swallow; fall through to wiki */
    }

    let summary = ddg.AbstractText ?? "";
    let image = ddg.Image ? (ddg.Image.startsWith("http") ? ddg.Image : `https://duckduckgo.com${ddg.Image}`) : undefined;
    let url = ddg.AbstractURL;
    const title = ddg.Heading || data.query;

    // Fallback: Wikipedia REST summary
    if (!summary) {
      try {
        const w = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.query.replace(/\s+/g, "_"))}`,
        );
        if (w.ok) {
          const wj = (await w.json()) as {
            extract?: string;
            thumbnail?: { source?: string };
            content_urls?: { desktop?: { page?: string } };
          };
          summary = wj.extract ?? "";
          if (!image && wj.thumbnail?.source) image = wj.thumbnail.source;
          if (!url) url = wj.content_urls?.desktop?.page;
        }
      } catch {
        /* ignore */
      }
    }

    const related = (ddg.RelatedTopics ?? [])
      .filter((t): t is { Text: string; FirstURL: string } => !!t.Text && !!t.FirstURL)
      .slice(0, 5)
      .map((t) => ({ title: t.Text, url: t.FirstURL }));

    return { title, summary: summary || "No results found.", image, url, related };
  });
