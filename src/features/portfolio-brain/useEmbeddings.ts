import { useState } from "react";
import { embedder } from "../../lib/qvac";
import { logger } from "../../lib/logger";
import { useWalletStore } from "../wallet/useWallet";
import {
  addToStore,
  createVectorStore,
  loadVectorStore,
  saveVectorStore,
} from "./vectorStore";

export type EmbeddingStatus = "idle" | "indexing" | "ready";

export function useEmbeddings() {
  const [status, setStatus] = useState<EmbeddingStatus>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | undefined>();
  const history = useWalletStore((state) => state.history);
  const historyStatus = useWalletStore((state) => state.historyStatus);
  const loadHistory = useWalletStore((state) => state.loadHistory);
  const address = useWalletStore((state) => state.address);

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
      } catch (embedError) {
        logger.warn("Embedding attempt failed", embedError);
      }
    }
    return undefined;
  };

  const buildIndex = async () => {
    setError(undefined);
    if (!address) {
      setError("Create a wallet before indexing history.");
      return;
    }

    if (historyStatus === "idle") {
      await loadHistory();
    }

    setStatus("indexing");
    try {
      const store = await loadVectorStore(address);
      store.records = [];

      const latestHistory = useWalletStore.getState().history;
      setProgress({ current: 0, total: latestHistory.length });
      for (let i = 0; i < latestHistory.length; i += 1) {
        const item = latestHistory[i];
        const embedding = await runEmbedder(item.description);
        if (!embedding) {
          continue;
        }
        await addToStore(store, {
          id: item.signature,
          text: item.description,
          embedding,
          metadata: { signature: item.signature, timestamp: item.timestamp },
        });
        setProgress({ current: i + 1, total: latestHistory.length });
      }

      await saveVectorStore(address, store);
      setStatus("ready");
    } catch (indexError) {
      const message =
        indexError instanceof Error
          ? indexError.message
          : "Failed to build embedding index.";
      logger.warn("Embedding index build failed", indexError);
      setError(message);
      setStatus("idle");
    }
  };

  return { status, buildIndex, progress, error };
}
