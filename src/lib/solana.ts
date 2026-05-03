import {
  Connection,
  PublicKey,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction,
} from "@solana/web3.js";
import { logger } from "./logger";

const rpcUrl =
  import.meta.env.VITE_SOLANA_RPC ?? "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, "confirmed");

export const getConnection = () => connection;

export async function getSolBalance(address: string) {
  const lamports = await connection.getBalance(new PublicKey(address));
  return lamports / 1e9;
}

export type TxHistoryItem = {
  signature: string;
  slot: number;
  timestamp?: number;
  description: string;
  programs: string[];
  feeLamports: number;
  netLamports?: number;
  counterparties: string[];
};

type HistoryOptions = {
  daysBack?: number;
  limit?: number;
};

const normalizeAmount = (value?: string | number) => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const describeParsedInstruction = (
  instruction: ParsedInstruction,
  walletAddress: string,
  counterparties: Set<string>,
) => {
  const parsed = instruction.parsed as Record<string, unknown> | undefined;
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const info = parsed.info as Record<string, unknown> | undefined;
  const type = parsed.type as string | undefined;
  if (!info || !type) {
    return undefined;
  }

  const source = info.source as string | undefined;
  const destination = info.destination as string | undefined;
  const authority = info.authority as string | undefined;
  const mint = info.mint as string | undefined;
  const amount = normalizeAmount(info.amount as string | number | undefined);
  const tokenAmount = info.tokenAmount as
    | { uiAmount?: number; amount?: string }
    | undefined;
  const uiAmount =
    tokenAmount?.uiAmount ?? normalizeAmount(tokenAmount?.amount);

  [source, destination, authority]
    .filter(
      (value): value is string => Boolean(value) && value !== walletAddress,
    )
    .forEach((value) => counterparties.add(value));

  if (type === "transfer" || type === "transferChecked") {
    const finalAmount = uiAmount ?? amount;
    const amountLabel = finalAmount !== undefined ? `${finalAmount}` : "token";
    const tokenLabel = mint ? ` (${mint.slice(0, 6)}...)` : "";
    return `Transfer ${amountLabel}${tokenLabel}`;
  }

  if (type === "approve" || type === "approveChecked") {
    return "Token approval updated";
  }

  if (type === "setAuthority") {
    return "Token authority changed";
  }

  return undefined;
};

const toProgramIdString = (
  instruction: ParsedInstruction | PartiallyDecodedInstruction,
) => {
  try {
    return instruction.programId.toBase58();
  } catch {
    return "unknown";
  }
};

const summarizeTransaction = (
  transaction: ParsedTransactionWithMeta,
  walletAddress: string,
): TxHistoryItem => {
  const programs = new Set<string>();
  const counterparties = new Set<string>();
  const summaries: string[] = [];

  for (const instruction of transaction.transaction.message.instructions) {
    programs.add(toProgramIdString(instruction));
    if ("parsed" in instruction) {
      const summary = describeParsedInstruction(
        instruction,
        walletAddress,
        counterparties,
      );
      if (summary) {
        summaries.push(summary);
      }
    }
  }

  const accountKeys = transaction.transaction.message.accountKeys.map((key) =>
    key.pubkey.toBase58(),
  );
  const walletIndex = accountKeys.findIndex((key) => key === walletAddress);
  const preBalance =
    walletIndex >= 0 ? transaction.meta?.preBalances?.[walletIndex] : undefined;
  const postBalance =
    walletIndex >= 0
      ? transaction.meta?.postBalances?.[walletIndex]
      : undefined;
  const netLamports =
    preBalance !== undefined && postBalance !== undefined
      ? postBalance - preBalance
      : undefined;

  const programList = [...programs];
  const description = summaries.length
    ? summaries.join(" · ")
    : `Interacted with ${programList.slice(0, 3).join(", ") || "Solana programs"}`;

  return {
    signature: transaction.transaction.signatures[0] ?? "unknown",
    slot: transaction.slot,
    timestamp: transaction.blockTime ?? undefined,
    description,
    programs: programList,
    feeLamports: transaction.meta?.fee ?? 0,
    netLamports,
    counterparties: [...counterparties],
  };
};

export async function fetchTxHistory(
  address: string,
  { daysBack = 90, limit = 100 }: HistoryOptions = {},
) {
  const wallet = new PublicKey(address);
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;
  const signatures: string[] = [];
  let before: string | undefined;
  let keepFetching = true;

  while (keepFetching && signatures.length < limit) {
    const batch = await connection.getSignaturesForAddress(wallet, {
      limit: Math.min(50, limit - signatures.length),
      before,
    });
    if (batch.length === 0) {
      break;
    }

    for (const entry of batch) {
      if (entry.blockTime && entry.blockTime < cutoff) {
        keepFetching = false;
        break;
      }
      signatures.push(entry.signature);
    }

    before = batch[batch.length - 1]?.signature;
  }

  const history: TxHistoryItem[] = [];
  for (const signature of signatures) {
    try {
      const parsed = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!parsed) {
        continue;
      }
      history.push(summarizeTransaction(parsed, address));
    } catch (error) {
      logger.warn("Failed to parse transaction", error);
    }
  }

  return history;
}
