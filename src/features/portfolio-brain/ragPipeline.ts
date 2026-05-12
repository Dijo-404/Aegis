import { embedder, llm } from "../../lib/qvac";
import { logger } from "../../lib/logger";
import { loadVectorStore, queryStore, type VectorRecord } from "./vectorStore";

export type PortfolioResponse = {
  answer: string;
  sources: VectorRecord[];
};

export async function queryPortfolio(
  question: string,
  address: string,
): Promise<PortfolioResponse> {
  let embedding: number[];
  try {
    embedding = await embedder.embed(question);
  } catch (error) {
    logger.warn("Embedding failed", error);
    return {
      answer: "Models are still loading. Try again in a moment.",
      sources: [],
    };
  }

  const store = await loadVectorStore(address);
  if (!store.records.length) {
    return {
      answer:
        "Your local index is empty. Either you haven't built it yet, or your wallet has no transaction history. Refresh your history on the Wallet tab, then rebuild the index.",
      sources: [],
    };
  }

  const scored = await queryStore(store, embedding, 5);
  const sources = scored.map((entry) => entry.record);
  const context = sources.map((r) => `- ${r.text}`).join("\n");

  const prompt = `System: You are a portfolio assistant grounded in the provided wallet history. Respond in concise sentences.\n\nUser question: ${question}\n\nWallet history:\n${context}\n\nAnswer:`;

  let answer: string;
  try {
    const result = await llm.generate({ prompt, maxTokens: 420, temperature: 0.2 });
    answer = result.text.trim() || "No answer generated.";
  } catch (error) {
    logger.warn("Portfolio LLM failed", error);
    answer = "Models are still loading. Try again in a moment.";
  }

  return { answer, sources };
}
