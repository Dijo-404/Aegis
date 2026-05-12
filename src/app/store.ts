import { create } from "zustand";
import { initQVAC } from "../lib/qvac";
import { logger } from "../lib/logger";

export type AppStatus = "idle" | "loading" | "ready" | "error";

type AppState = {
  qvacStatus: AppStatus;
  qvacError?: string;
  modelLoadProgress: number;
  modelLoadLabel: string;
  initialize: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  qvacStatus: "idle",
  qvacError: undefined,
  modelLoadProgress: 0,
  modelLoadLabel: "",
  initialize: async () => {
    const { qvacStatus } = get();
    if (qvacStatus === "loading" || qvacStatus === "ready") {
      return;
    }

    set({ qvacStatus: "loading", qvacError: undefined, modelLoadProgress: 0 });
    try {
      await initQVAC(({ status, progress }) => {
        set({ modelLoadLabel: status, modelLoadProgress: Math.round(progress) });
      });
      set({ qvacStatus: "ready", modelLoadProgress: 100 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initialize models.";
      logger.error(message);
      set({ qvacStatus: "error", qvacError: message });
    }
  },
}));
