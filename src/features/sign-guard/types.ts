export type TxRisk = "safe" | "warning" | "danger";

export type TxAnalysis = {
  summary: string;
  risk: TxRisk;
  flags: string[];
  programs: string[];
  accounts: string[];
  method: "llm" | "heuristic";
};

export type TxExplainInput = {
  rawText?: string;
  transaction?: unknown;
  walletAddress?: string;
};
