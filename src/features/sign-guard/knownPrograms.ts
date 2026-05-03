import { ComputeBudgetProgram, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const KNOWN_PROGRAMS = new Map<string, string>([
  [SystemProgram.programId.toBase58(), "System Program"],
  [TOKEN_PROGRAM_ID.toBase58(), "SPL Token"],
  [TOKEN_2022_PROGRAM_ID.toBase58(), "SPL Token 2022"],
  [ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(), "Associated Token"],
  [ComputeBudgetProgram.programId.toBase58(), "Compute Budget"],
  ["MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", "Memo"],
  ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter V6"],
  ["9xQeWvG816bUx9EPfpi6qz9rU7T8KX4v5eF2oV7oMZ36", "Serum DEX"],
]);

export const getProgramLabel = (programId: string) =>
  KNOWN_PROGRAMS.get(programId) ?? "Unknown program";

export const isKnownProgram = (programId: string) =>
  KNOWN_PROGRAMS.has(programId);
