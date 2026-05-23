import { useEffect, useRef } from "react";
import { AssistantMessage, UserMessage } from "./Message";
import type { ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  onRegenerate: () => void;
  onFeedback?: (messageId: string, v: "up" | "down" | null) => void;
};

export function ChatView({ messages, loading, onRegenerate, onFeedback }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: mountedRef.current ? "smooth" : "auto",
      block: "end",
    });
    mountedRef.current = true;
  }, [messages, loading]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-8">
      <div className="space-y-8">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          return m.role === "user" ? (
            <UserMessage key={m.id} m={m} />
          ) : (
            <AssistantMessage
              key={m.id}
              m={m}
              streaming={loading && isLast}
              onRegenerate={isLast ? onRegenerate : undefined}
              onFeedback={(v) => onFeedback?.(m.id, v)}
            />
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
