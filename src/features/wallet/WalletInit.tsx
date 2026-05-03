import { useState } from "react";
import { SectionCard } from "../../components/SectionCard";
import { useWalletStore } from "./useWallet";

const formatAddress = (address?: string) => {
  if (!address) {
    return "Not created yet";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) {
    return "—";
  }
  return new Date(timestamp * 1000).toLocaleDateString();
};

export function WalletInit() {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const loading = useWalletStore((state) => state.loading);
  const error = useWalletStore((state) => state.error);
  const history = useWalletStore((state) => state.history);
  const historyStatus = useWalletStore((state) => state.historyStatus);
  const historyError = useWalletStore((state) => state.historyError);
  const create = useWalletStore((state) => state.create);
  const connectExternal = useWalletStore((state) => state.connectExternal);
  const isExternal = useWalletStore((state) => state.isExternal);
  const refreshBalance = useWalletStore((state) => state.refreshBalance);
  const loadHistory = useWalletStore((state) => state.loadHistory);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <SectionCard
      kicker="Wallet Core"
      title="Non-custodial wallet"
      description="Create a local WDK wallet and pull a live devnet balance."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Address {isExternal && "(Phantom)"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-lg font-semibold text-ink">
                {formatAddress(address)}
              </p>
              {address && (
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Balance (SOL)
            </p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {balance === undefined ? "—" : balance.toFixed(4)}
            </p>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <button
            className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            onClick={() => void create()}
            disabled={loading}
          >
            {loading ? "Processing..." : "Create local wallet"}
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            onClick={() => void connectExternal()}
            disabled={loading}
          >
            Connect Phantom
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            onClick={() => void refreshBalance()}
            disabled={!address}
          >
            Refresh balance
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            onClick={() => void loadHistory()}
            disabled={!address || historyStatus === "loading"}
          >
            {historyStatus === "loading"
              ? "Loading history..."
              : "Refresh history"}
          </button>
          <p className="text-sm text-slate-600">
            This is wired for devnet. Mainnet toggle will live next to the RPC
            selector.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Recent activity
          </p>
          <span className="text-xs font-semibold uppercase text-slate-500">
            {historyStatus}
          </span>
        </div>
        {historyError && (
          <p className="mt-2 text-sm text-rose-600">{historyError}</p>
        )}
        <div className="mt-3 space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-slate-500">
              No transactions found in the last 90 days.
            </p>
          )}
          {history.slice(0, 4).map((item) => (
            <div
              key={item.signature}
              className="rounded-xl border border-slate-200 bg-white/70 p-3"
            >
              <p className="text-sm font-semibold text-ink">
                {item.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(item.timestamp)} · {item.signature.slice(0, 6)}...
                {item.signature.slice(-4)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
