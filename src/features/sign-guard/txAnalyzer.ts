import type {
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getProgramLabel, isKnownProgram } from "./knownPrograms";
import type { TxAnalysis, TxRisk } from "./types";

const MAX_U64 = BigInt("18446744073709551615");

const toHex = (data: Uint8Array) =>
  Array.from(data)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const readU64LE = (data: Uint8Array, offset: number) => {
  let value = BigInt(0);
  for (let i = 0; i < 8; i += 1) {
    value |= BigInt(data[offset + i] ?? 0) << BigInt(8 * i);
  }
  return value;
};

const analyzeTokenInstruction = (data: Uint8Array, flags: Set<string>) => {
  if (!data.length) {
    return;
  }
  const instruction = data[0];
  if (instruction === 6) {
    flags.add("setAuthority detected (ownership change)");
  }
  if (instruction === 4 || instruction === 13) {
    const amount = readU64LE(data, 1);
    if (amount >= MAX_U64 - BigInt(10)) {
      flags.add("Unlimited approve detected");
    } else {
      flags.add("Approve instruction detected");
    }
  }
};

const isTokenProgram = (programId: string) =>
  [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(
    programId,
  );

export type TxDetails = {
  programs: string[];
  accounts: string[];
  flags: string[];
  instructionHex: string[];
  unknownPrograms: string[];
};

const buildHeuristicAnalysis = (details: TxDetails): TxAnalysis => {
  const flags = details.flags.length
    ? details.flags
    : ["No suspicious patterns detected."];
  let risk: TxRisk = "safe";
  if (details.flags.length >= 2 || details.unknownPrograms.length >= 2) {
    risk = "danger";
  } else if (
    details.flags.length === 1 ||
    details.unknownPrograms.length === 1
  ) {
    risk = "warning";
  }

  const summary =
    risk === "safe"
      ? "No obvious red flags detected. Review details before signing."
      : "Potentially risky instructions found. Confirm intent before signing.";

  return {
    summary,
    risk,
    flags,
    programs: details.programs,
    accounts: details.accounts,
    method: "heuristic",
  };
};

const extractFromInstructions = (
  instructions: TransactionInstruction[],
  walletAddress?: string,
): TxDetails => {
  const programIds = new Set<string>();
  const accounts = new Set<string>();
  const flags = new Set<string>();
  const instructionHex: string[] = [];

  for (const instruction of instructions) {
    const programId = instruction.programId.toBase58();
    programIds.add(programId);
    instruction.keys.forEach((key) => accounts.add(key.pubkey.toBase58()));

    if (isTokenProgram(programId)) {
      analyzeTokenInstruction(instruction.data, flags);
    }

    instructionHex.push(toHex(instruction.data));
  }

  if (programIds.size > 3) {
    flags.add("Multiple program invocations in one transaction");
  }

  if (walletAddress) {
    const outgoing = instructions.filter((ix) =>
      ix.keys.some(
        (key) => key.pubkey.toBase58() === walletAddress && key.isSigner,
      ),
    );
    if (outgoing.length >= 2) {
      flags.add("Multiple signer instructions detected");
    }
  }

  const programList = [...programIds];
  const unknownPrograms = programList.filter(
    (programId) => !isKnownProgram(programId),
  );
  if (unknownPrograms.length) {
    flags.add("Unknown program id detected");
  }

  return {
    programs: programList.map(
      (programId) => `${getProgramLabel(programId)} (${programId})`,
    ),
    accounts: [...accounts],
    flags: [...flags],
    instructionHex,
    unknownPrograms,
  };
};

const extractFromVersioned = (transaction: VersionedTransaction): TxDetails => {
  const programIds = new Set<string>();
  const accounts = new Set<string>();
  const instructionHex: string[] = [];

  const message = transaction.message as any;
  const accountKeys: any[] =
    typeof message.getAccountKeys === "function"
      ? message.getAccountKeys().staticAccountKeys
      : message.accountKeys || message.staticAccountKeys;
  const accountStrings = accountKeys.map((key: any) => key.toBase58());

  for (const instruction of message.compiledInstructions) {
    const programId = accountStrings[instruction.programIdIndex] ?? "unknown";
    programIds.add(programId);
    instruction.accountKeyIndexes.forEach((index: number) => {
      const key = accountStrings[index];
      if (key) {
        accounts.add(key);
      }
    });
    if (typeof instruction.data === "string") {
      instructionHex.push(instruction.data);
    }
  }

  const programList = [...programIds];
  const unknownPrograms = programList.filter(
    (programId) => !isKnownProgram(programId),
  );
  const flags = unknownPrograms.length ? ["Unknown program id detected"] : [];

  if (programIds.size > 3) {
    flags.push("Multiple program invocations in one transaction");
  }

  return {
    programs: programList.map(
      (programId) => `${getProgramLabel(programId)} (${programId})`,
    ),
    accounts: [...accounts],
    flags,
    instructionHex,
    unknownPrograms,
  };
};

export const extractTransactionDetails = (
  transaction?: Transaction | VersionedTransaction,
  walletAddress?: string,
) => {
  if (!transaction) {
    return {
      programs: ["Unknown"],
      accounts: [],
      flags: ["Unable to parse transaction payload"],
      instructionHex: [],
      unknownPrograms: ["Unknown"],
    };
  }

  return "version" in transaction
    ? extractFromVersioned(transaction as VersionedTransaction)
    : extractFromInstructions((transaction as Transaction).instructions, walletAddress);
};

export const analyzeTransactionHeuristically = (details: TxDetails) =>
  buildHeuristicAnalysis(details);

export const buildPromptContext = (details: TxDetails) => {
  const programIds = details.programs.map(
    (entry) => entry.split("(")[1]?.replace(")", "") ?? entry,
  );
  return {
    programIds,
    tokenAccounts: details.accounts.slice(0, 6),
    instructionHex: details.instructionHex.slice(0, 4),
  };
};
