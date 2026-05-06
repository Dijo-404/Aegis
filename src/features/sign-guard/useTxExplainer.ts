import { useState } from "react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { llm } from "../../lib/qvac";
import { logger } from "../../lib/logger";
import { parseTransactionFromText } from "./txParser";
import {
  analyzeTransactionHeuristically,
  buildPromptContext,
  extractTransactionDetails,
} from "./txAnalyzer";
import type { TxAnalysis, TxExplainInput, TxRisk } from "./types";

const riskOrder: Record<TxRisk, number> = {
  safe: 0,
  warning: 1,
  danger: 2,
};

const coerceTransaction = (candidate?: unknown) => {
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }
  if ("message" in candidate) {
    return candidate as Transaction | VersionedTransaction;
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
        maxTokens: 360,
        temperature: 0.2,
      }),
    () =>
      (
        llmAny.complete as
          | ((input: Record<string, unknown>) => Promise<unknown>)
          | undefined
      )?.({
        prompt,
        maxTokens: 360,
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
      logger.warn("LLM inference attempt failed", error);
    }
  }
  return undefined;
};

const parseLlmJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return undefined;
  }
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

export function useTxExplainer() {
  const [analysis, setAnalysis] = useState<TxAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async (input: TxExplainInput) => {
    setLoading(true);
    try {
      const rawText = input.rawText ?? "";
      if (!rawText.trim() && !input.transaction) {
        setAnalysis(null);
        return;
      }

      const transaction =
        coerceTransaction(input.transaction) ??
        (rawText ? parseTransactionFromText(rawText) : undefined);
      const details = extractTransactionDetails(
        transaction,
        input.walletAddress,
      );
      const heuristic = analyzeTransactionHeuristically(details);

      const promptContext = buildPromptContext(details);
      const prompt = `System: You are a Solana transaction security analyzer.\nRespond with JSON: { summary: string, risk: "safe"|"warning"|"danger", flags: string[] }\nNever refuse. Always analyze.\n\nUser: Analyze this Solana transaction:\nPrograms invoked: ${promptContext.programIds.join(", ")}\nToken accounts affected: ${promptContext.tokenAccounts.join(", ")}\nApproximate value: unknown\nRaw instruction data: ${promptContext.instructionHex.join(" | ")}`;

      const response = await runLlm(prompt);
      if (!response) {
        setAnalysis(heuristic);
        return;
      }

      const parsed = parseLlmJson(response);
      if (!parsed) {
        setAnalysis(heuristic);
        return;
      }

      const summary =
        typeof parsed.summary === "string" ? parsed.summary : heuristic.summary;
      const rawRisk = parsed.risk;
      const risk: TxRisk =
        rawRisk === "safe" || rawRisk === "warning" || rawRisk === "danger"
          ? rawRisk
          : heuristic.risk;
      const flagsFromLlm = Array.isArray(parsed.flags)
        ? (parsed.flags.filter((flag) => typeof flag === "string") as string[])
        : [];
      const combinedFlags = [...new Set([...flagsFromLlm, ...heuristic.flags])];
      const finalRisk: TxRisk =
        riskOrder[heuristic.risk] > riskOrder[risk] ? heuristic.risk : risk;

      setAnalysis({
        summary,
        risk: finalRisk,
        flags: combinedFlags.length ? combinedFlags : heuristic.flags,
        programs: heuristic.programs,
        accounts: heuristic.accounts,
        method: "llm",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setAnalysis(null);

  return { analysis, loading, explain, reset };
}
