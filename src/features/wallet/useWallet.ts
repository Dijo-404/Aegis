import { create } from "zustand";
import { createWallet } from "./wdk.config";
import {
  fetchTxHistory,
  getSolBalance,
  type TxHistoryItem,
} from "../../lib/solana";
import { getStoredValue, setStoredValue } from "../../lib/storage";

type HistoryStatus = "idle" | "loading" | "ready" | "error";

type WalletState = {
  address?: string;
  isExternal: boolean;
  balance?: number;
  loading: boolean;
  error?: string;
  history: TxHistoryItem[];
  historyStatus: HistoryStatus;
  historyError?: string;
  create: () => Promise<void>;
  connectExternal: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  loadHistory: () => Promise<void>;
};

const historyKey = (address: string) => `tx-history:${address}`;

export const useWalletStore = create<WalletState>((set, get) => ({
  address: undefined,
  isExternal: false,
  balance: undefined,
  loading: false,
  error: undefined,
  history: [],
  historyStatus: "idle",
  historyError: undefined,
  create: async () => {
    set({ loading: true, error: undefined });
    try {
      const wallet = await createWallet();
      set({
        address: wallet.address,
        isExternal: false,
        loading: false,
        history: [],
        historyStatus: "idle",
      });
      await get().refreshBalance();
      await get().loadHistory();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create wallet.";
      set({ loading: false, error: message });
    }
  },
  connectExternal: async () => {
    set({ loading: true, error: undefined });
    try {
      if (!("solana" in window)) throw new Error("Phantom wallet not found.");
      const provider = (window as any).solana;
      if (!provider.isPhantom) throw new Error("Phantom wallet not found.");
      
      const response = await provider.connect();
      set({
        address: response.publicKey.toString(),
        isExternal: true,
        loading: false,
        history: [],
        historyStatus: "idle",
      });
      await get().refreshBalance();
      await get().loadHistory();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect external wallet.";
      set({ loading: false, error: message });
    }
  },
  refreshBalance: async () => {
    const address = get().address;
    if (!address) {
      return;
    }
    try {
      const balance = await getSolBalance(address);
      set({ balance });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch balance.";
      set({ error: message });
    }
  },
  loadHistory: async () => {
    const address = get().address;
    if (!address) {
      return;
    }

    set({ historyStatus: "loading", historyError: undefined });
    const cached = await getStoredValue<TxHistoryItem[]>(historyKey(address));
    if (cached?.length) {
      set({ history: cached, historyStatus: "ready" });
    }

    try {
      const fresh = await fetchTxHistory(address, { daysBack: 90, limit: 120 });
      set({ history: fresh, historyStatus: "ready" });
      await setStoredValue(historyKey(address), fresh);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch transaction history.";
      set({ historyStatus: "error", historyError: message });
    }
  },
}));
