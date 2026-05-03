import { useState, type FormEvent } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { queryPortfolio } from './ragPipeline';
import { useEmbeddings } from './useEmbeddings';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function PortfolioChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Ask about your recent activity, spending, or suspicious programs.',
    },
  ]);
  const [input, setInput] = useState('');
  const { status, buildIndex } = useEmbeddings();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) {
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');

    const response = await queryPortfolio(question);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
  };

  return (
    <SectionCard
      kicker="Portfolio Brain"
      title="Local RAG over wallet history"
      description="Embeddings stay on device. Queries never leave your machine."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void buildIndex()}
          >
            {status === 'indexing' ? 'Indexing...' : status === 'ready' ? 'Rebuild index' : 'Index wallet history'}
          </button>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{status}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-ink text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
              placeholder="What did I spend this week?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </SectionCard>
  );
}
