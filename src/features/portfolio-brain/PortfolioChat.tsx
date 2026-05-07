import { useEffect, useState, type FormEvent } from "react";
import { SectionCard } from "../../components/SectionCard";
import { queryPortfolio } from "./ragPipeline";
import { useEmbeddings } from "./useEmbeddings";
import { useWalletStore } from "../wallet/useWallet";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const QUERY_KEY = "aegis:portfolioQuery";

export function PortfolioChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask about your recent activity, spending, or suspicious programs.",
    },
  ]);
  const [input, setInput] = useState("");
  const { status, buildIndex, progress, error } = useEmbeddings();
  const address = useWalletStore((state) => state.address);

  const submitQuestion = async (question: string) => {
    if (!address) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Create a wallet to enable portfolio queries.",
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    const response = await queryPortfolio(question, address);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: response.answer,
        sources: response.sources.map((record) => record.text),
      },
    ]);
  };

  useEffect(() => {
    const pending = sessionStorage.getItem(QUERY_KEY);
    if (pending) {
      sessionStorage.removeItem(QUERY_KEY);
      setInput("");
      void submitQuestion(pending);
    }
  }, [address]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) {
      return;
    }

    setInput("");
    await submitQuestion(question);
  };

  return (
    <SectionCard
      kicker="Portfolio Brain"
      title="Local RAG over wallet history"
      description="Embeddings stay on device. Queries never leave your machine."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="stripe-btn-primary"
            onClick={() => void buildIndex()}
          >
            {status === "indexing"
              ? "Indexing..."
              : status === "ready"
                ? "Rebuild index"
                : "Index wallet history"}
          </button>
          <span className="stripe-kicker">Status: {status}</span>
          {status === "indexing" && (
            <span className="font-mono text-xs tabular-nums text-body">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
        {error && (
          <p className="rounded border border-ruby/30 bg-ruby/5 px-3 py-2 text-sm font-light text-ruby">
            {error}
          </p>
        )}

        <div className="rounded-md border border-border bg-white shadow-ambient">
          <div className="flex flex-col gap-2 p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-md bg-purple px-4 py-2.5 text-sm font-light text-white"
                    : "mr-auto max-w-[85%] rounded-md border border-border bg-slate-50 px-4 py-2.5 text-sm font-light text-heading"
                }
              >
                <p className="leading-relaxed">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border pt-2">
                    <p className="stripe-kicker">Sources</p>
                    {message.sources.slice(0, 3).map((source) => (
                      <p
                        key={source}
                        className="font-mono text-[11px] leading-snug text-body"
                      >
                        {source}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form
            className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <input
              className="stripe-input flex-1"
              placeholder="What did I spend this week?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" className="stripe-btn-primary">
              Ask
            </button>
          </form>
        </div>
      </div>
    </SectionCard>
  );
}
