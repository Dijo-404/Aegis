import type { Transaction } from "@solana/web3.js";
import { buildTransfer } from "../wallet/wdk.config";
import type { ParsedIntent } from "./intentParser";

export type TxPreview = {
  label: string;
  details: string;
  warning?: string;
};

export function buildTxPreview(intent: ParsedIntent): TxPreview {
  if (
    intent.action === "send" &&
    intent.amount &&
    intent.token &&
    intent.recipient
  ) {
    return {
      label: "Transfer preview",
      details: `Send ${intent.amount} ${intent.token} to ${intent.recipient}.`,
    };
  }

  if (intent.action === "query") {
    return {
      label: "Portfolio query",
      details: intent.query?.length
        ? intent.query
        : "Ask a portfolio question to continue.",
    };
  }

  return {
    label: "Intent not ready",
    details: "Provide a clear send or query command.",
    warning: "Voice intent needs more detail.",
  };
}

export async function buildTransactionFromIntent(intent: ParsedIntent) {
  if (
    intent.action !== "send" ||
    !intent.amount ||
    !intent.token ||
    !intent.recipient
  ) {
    return undefined;
  }

  const token = intent.token.toUpperCase();
  if (token !== "SOL" && token !== "USDT") {
    throw new Error(`Unsupported token: ${token}`);
  }

  const transaction = await buildTransfer({
    to: intent.recipient,
    amount: intent.amount,
    token: token as "SOL" | "USDT",
  });

  return transaction as Transaction;
}
