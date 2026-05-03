import type { TxAnalysis, TxRisk } from './useTxExplainer';

const riskTone: Record<TxRisk, string> = {
  safe: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
};

export function TxWarningModal({
  analysis,
  onApprove,
  onReject,
}: {
  analysis: TxAnalysis;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">Sign Guard verdict</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${riskTone[analysis.risk]}`}>
          {analysis.risk}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{analysis.summary}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {analysis.flags.map((flag) => (
          <li key={flag}>• {flag}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
          onClick={onApprove}
        >
          Sign anyway
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink"
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
