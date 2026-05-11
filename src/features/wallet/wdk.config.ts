import { WDK } from "@tether/wdk";
import type { Transaction } from "@solana/web3.js";

const rpcUrl = import.meta.env.VITE_SOLANA_RPC;
if (!rpcUrl) {
  throw new Error(
    "VITE_SOLANA_RPC is not set. Copy .env.example to .env and configure your RPC endpoint.",
  );
}

export const wdk = new WDK({
  network: "solana",
  rpcUrl,
  storage: "indexeddb",
  nonCustodial: true,
  usdtMint: import.meta.env.VITE_USDT_MINT,
});

export async function createWallet() {
  const wallet = await wdk.createWallet();
  return wallet as { address: string; publicKey?: string };
}

export async function buildTransfer(params: {
  to: string;
  amount: number;
  token: "SOL" | "USDT";
}) {
  const tx = await wdk.buildTransfer(params);
  return tx as Transaction;
}

export async function signAndBroadcast(tx: Transaction) {
  const signed = await wdk.sign(tx);
  const sig = await wdk.broadcast(signed);
  return sig as string;
}
