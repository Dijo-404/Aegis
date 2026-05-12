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
      const prompt = `System: You are a Solana transaction security analyzer.\nRespond with JSON only: { "summary": string, "risk": "safe"|"warning"|"danger", "flags": string[] }\n\nAnalyze this Solana transaction:\nPrograms invoked: ${promptContext.programIds.join(", ")}\nToken accounts affected: ${promptContext.tokenAccounts.join(", ")}\nRaw instruction data: ${promptContext.instructionHex.join(" | ")}`;

      let response: string | undefined;
      try {
        const result = await llm.generate({ prompt, maxTokens: 360, temperature: 0.2 });
        response = result.text;
      } catch (error) {
        logger.warn("LLM inference failed, using heuristic", error);
      }

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
        ? (parsed.flags.filter((f) => typeof f === "string") as string[])
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
