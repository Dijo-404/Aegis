import { Transaction, VersionedTransaction } from "@solana/web3.js";

const hexRegex = /^[0-9a-fA-F]+$/;
const base64Regex = /^[A-Za-z0-9+/=]+$/;

const decodeBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const decodeHex = (value: string) => {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = parseInt(value.slice(i, i + 2), 16);
  }
  return bytes;
};

const tryDeserialize = (bytes: Uint8Array) => {
  try {
    return VersionedTransaction.deserialize(bytes);
  } catch {
    try {
      return Transaction.from(bytes);
    } catch {
      return undefined;
    }
  }
};

const unwrapTransactionPayload = (rawText: string) => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate =
        (parsed.transaction as string | undefined) ??
        (parsed.tx as string | undefined) ??
        (parsed.payload as string | undefined);
      if (candidate && typeof candidate === "string") {
        return candidate.trim();
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

export const parseTransactionFromText = (rawText: string) => {
  const payload = unwrapTransactionPayload(rawText);
  if (!payload) {
    return undefined;
  }

  const compact = payload.replace(/\s+/g, "");
  if (hexRegex.test(compact) && compact.length % 2 === 0) {
    return tryDeserialize(decodeHex(compact));
  }

  if (base64Regex.test(compact)) {
    try {
      return tryDeserialize(decodeBase64(compact));
    } catch {
      return undefined;
    }
  }

  return undefined;
};
