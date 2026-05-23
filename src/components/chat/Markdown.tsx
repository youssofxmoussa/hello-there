import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
  const code = String(children ?? "").replace(/\n$/, "");
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-4 overflow-hidden rounded-2xl border border-border bg-[oklch(0.985_0_0)]">
      <div className="flex items-center justify-between border-b border-border bg-[oklch(0.97_0_0)] px-4 py-2 text-xs">
        <span className="font-mono lowercase tracking-wide text-muted-foreground">{lang}</span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-foreground/70 hover:bg-background hover:text-foreground transition"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span className="font-medium">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0 !bg-transparent">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
          code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
            const isBlock = /language-/.test(className || "");
            if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table>{children}</table>
            </div>
          ),
          input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
            props.type === "checkbox" ? (
              <input
                type="checkbox"
                disabled
                checked={props.checked}
                className="mr-2 h-4 w-4 rounded border-border align-middle accent-foreground"
                readOnly
              />
            ) : (
              <input {...props} />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
