import { create } from 'zustand';
import { initQVAC } from '../lib/qvac';
import { logger } from '../lib/logger';

export type AppStatus = 'idle' | 'loading' | 'ready' | 'error';

type AppState = {
  qvacStatus: AppStatus;
  qvacError?: string;
  initialize: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  qvacStatus: 'idle',
  qvacError: undefined,
  initialize: async () => {
    const { qvacStatus } = get();
    if (qvacStatus === 'loading' || qvacStatus === 'ready') {
      return;
    }

    set({ qvacStatus: 'loading', qvacError: undefined });
    try {
      await initQVAC();
      set({ qvacStatus: 'ready' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize QVAC.';
      logger.error(message);
      set({ qvacStatus: 'error', qvacError: message });
    }
  },
}));
