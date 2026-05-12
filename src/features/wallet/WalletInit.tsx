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
      description="Create a local WDK wallet and pull a live devnet balance — keys never leave the browser."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <div className="rounded border border-border bg-white p-4">
            <p className="stripe-kicker">Address</p>
            <p className="mt-2 font-mono text-base font-medium tabular-nums text-heading">
              {formatAddress(address)}
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
          <div className="rounded border border-border bg-white p-4">
            <p className="stripe-kicker">Balance · SOL</p>
            <p className="mt-2 text-subheading tracking-subheading tabular-nums text-heading">
              {balance === undefined ? "—" : balance.toFixed(4)}
            </p>
          </div>
          {error && (
            <p className="rounded border border-ruby/30 bg-ruby/5 px-3 py-2 text-sm font-light text-ruby">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="stripe-btn-primary"
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
            className="stripe-btn-ghost"
            onClick={() => void refreshBalance()}
            disabled={!address}
          >
            Refresh balance
          </button>
          <button
            className="stripe-btn-neutral"
            onClick={() => void loadHistory()}
            disabled={!address || historyStatus === "loading"}
          >
            {historyStatus === "loading"
              ? "Loading history..."
              : "Refresh history"}
          </button>
          <p className="mt-1 text-sm font-light leading-relaxed text-body">
            Connected to{" "}
            <span className="font-mono text-xs">
              {import.meta.env.VITE_SOLANA_NETWORK ?? "mainnet-beta"}
            </span>
            . Configure <span className="font-mono text-xs">VITE_SOLANA_RPC</span> in{" "}
            <span className="font-mono text-xs">.env</span> to switch networks.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-border bg-white p-5 shadow-ambient">
        <div className="flex items-center justify-between">
          <p className="stripe-kicker">Recent activity</p>
          <span className="font-mono text-[11px] uppercase tracking-wider text-body">
            {historyStatus}
          </span>
        </div>
        {historyError && (
          <p className="mt-2 text-sm font-light text-ruby">{historyError}</p>
        )}
        <div className="mt-4 space-y-2">
          {history.length === 0 && (
            <p className="text-sm font-light text-body">
              No transactions found in the last 90 days.
            </p>
          )}
          {history.slice(0, 4).map((item) => (
            <div
              key={item.signature}
              className="rounded border border-border bg-white px-4 py-3 transition-shadow hover:shadow-ambient"
            >
              <p className="text-sm font-normal text-heading">
                {item.description}
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-body">
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
