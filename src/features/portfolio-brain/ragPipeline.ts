import { embedder, llm } from "../../lib/qvac";
import { logger } from "../../lib/logger";
import { loadVectorStore, queryStore, type VectorRecord } from "./vectorStore";

export type PortfolioResponse = {
  answer: string;
  sources: VectorRecord[];
};

const runEmbedder = async (text: string) => {
  const embedderAny = embedder as unknown as Record<string, unknown>;
  const candidates = [
    () =>
      (
        embedderAny.embed as ((input: string) => Promise<unknown>) | undefined
      )?.(text),
    () =>
      (
        embedderAny.generate as
          | ((input: string) => Promise<unknown>)
          | undefined
      )?.(text),
    () =>
      (
        embedderAny.embedText as
          | ((input: string) => Promise<unknown>)
          | undefined
      )?.(text),
  ];

  for (const attempt of candidates) {
    if (!attempt) {
      continue;
    }
    try {
      const result = await attempt();
      if (Array.isArray(result)) {
        return result as number[];
      }
      if (result && typeof result === "object") {
        const record = result as Record<string, unknown>;
        if (Array.isArray(record.embedding)) {
          return record.embedding as number[];
        }
        if (Array.isArray(record.vector)) {
          return record.vector as number[];
        }
      }
    } catch (error) {
      logger.warn("Embedding query failed", error);
    }
  }
  return undefined;
};

const extractText = (result: unknown) => {
  if (!result) {
    return undefined;
  }
  if (typeof result === "string") {
    return result;
  }
  if (typeof result === "object") {
    const record = result as Record<string, unknown>;
    return (
      (record.text as string | undefined) ??
      (record.output as string | undefined) ??
      (record.response as string | undefined)
    );
  }
  return undefined;
};

const runLlm = async (prompt: string) => {
  const llmAny = llm as unknown as Record<string, unknown>;
  const candidates = [
    () =>
      (
        llmAny.generate as
          | ((input: Record<string, unknown>) => Promise<unknown>)
          | undefined
      )?.({
        prompt,
        maxTokens: 420,
        temperature: 0.2,
      }),
    () =>
      (
        llmAny.complete as
          | ((input: Record<string, unknown>) => Promise<unknown>)
          | undefined
      )?.({
        prompt,
        maxTokens: 420,
        temperature: 0.2,
      }),
    () =>
      (llmAny.infer as ((input: string) => Promise<unknown>) | undefined)?.(
        prompt,
      ),
    () =>
      (llmAny.run as ((input: string) => Promise<unknown>) | undefined)?.(
        prompt,
      ),
    () =>
      (llmAny.generate as ((input: string) => Promise<unknown>) | undefined)?.(
        prompt,
      ),
  ];

  for (const attempt of candidates) {
    if (!attempt) {
      continue;
    }
    try {
      const result = await attempt();
      const text = extractText(result);
      if (text) {
        return text;
      }
    } catch (error) {
      logger.warn("Portfolio LLM attempt failed", error);
    }
  }

  return undefined;
};

export async function queryPortfolio(
  question: string,
  address: string,
): Promise<PortfolioResponse> {
  const embedding = await runEmbedder(question);
  if (!embedding) {
    return {
      answer:
        "Unable to embed your query locally yet. Try again once models are ready.",
      sources: [],
    };
  }

  const store = await loadVectorStore(address);
  if (!store.records.length) {
    return {
      answer:
        "Your local index is empty. Build the wallet history index first.",
      sources: [],
    };
  }

  const scored = await queryStore(store, embedding, 5);
  const sources = scored.map((entry) => entry.record);
  const context = sources.map((record) => `- ${record.text}`).join("\n");

  const prompt = `System: You are a portfolio assistant grounded in the provided wallet history. Respond in concise sentences.\nUser question: ${question}\n\nWallet history:\n${context}\n\nAnswer:`;
  const response = await runLlm(prompt);
  return {
    answer:
      response ??
      "Unable to answer locally yet. Try again once models are ready.",
    sources,
  };
}
