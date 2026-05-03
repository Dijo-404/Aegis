import { create } from 'zustand';
import { createWallet } from './wdk.config';
import { getSolBalance } from '../../lib/solana';

type WalletState = {
  address?: string;
  balance?: number;
  loading: boolean;
  error?: string;
  create: () => Promise<void>;
  refreshBalance: () => Promise<void>;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  address: undefined,
  balance: undefined,
  loading: false,
  error: undefined,
  create: async () => {
    set({ loading: true, error: undefined });
    try {
      const wallet = await createWallet();
      set({ address: wallet.address, loading: false });
      await get().refreshBalance();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create wallet.';
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
      const message = error instanceof Error ? error.message : 'Failed to fetch balance.';
      set({ error: message });
    }
  },
}));
