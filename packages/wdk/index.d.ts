import type { Transaction } from "@solana/web3.js";

type WdkConfig = {
  network: "solana";
  rpcUrl: string;
  storage?: string;
  nonCustodial?: boolean;
  usdtMint?: string;
};

type TransferParams = {
  to: string;
  amount: number;
  token: "SOL" | "USDT";
};

export class WDK {
  constructor(config: WdkConfig);
  createWallet(): Promise<{ address: string; publicKey: string }>;
  buildTransfer(params: TransferParams): Promise<Transaction>;
  sign(tx: Transaction): Promise<Transaction>;
  broadcast(tx: Transaction): Promise<string>;
}
