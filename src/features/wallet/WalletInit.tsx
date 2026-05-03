import { SectionCard } from '../../components/SectionCard';
import { useWalletStore } from './useWallet';

const formatAddress = (address?: string) => {
  if (!address) {
    return 'Not created yet';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function WalletInit() {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const loading = useWalletStore((state) => state.loading);
  const error = useWalletStore((state) => state.error);
  const create = useWalletStore((state) => state.create);
  const refreshBalance = useWalletStore((state) => state.refreshBalance);

  return (
    <SectionCard
      kicker="Wallet Core"
      title="Non-custodial wallet"
      description="Create a local WDK wallet and pull a live devnet balance."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</p>
            <p className="mt-2 text-lg font-semibold text-ink">{formatAddress(address)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Balance (SOL)</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {balance === undefined ? '—' : balance.toFixed(4)}
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
            {loading ? 'Creating wallet...' : 'Create wallet'}
          </button>
          <button
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            onClick={() => void refreshBalance()}
            disabled={!address}
          >
            Refresh balance
          </button>
          <p className="text-sm text-slate-600">
            This is wired for devnet. Mainnet toggle will live next to the RPC selector.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
