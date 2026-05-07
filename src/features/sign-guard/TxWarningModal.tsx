import type { TxAnalysis, TxRisk } from "./types";

const riskBadge: Record<TxRisk, string> = {
  safe: "stripe-badge-success",
  warning: "stripe-badge-warning",
  danger: "stripe-badge-danger",
};

const riskAccent: Record<TxRisk, string> = {
  safe: "border-l-success",
  warning: "border-l-lemon",
  danger: "border-l-ruby",
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
    <div
      className={`rounded-md border border-border border-l-4 bg-white p-5 shadow-elevated ${riskAccent[analysis.risk]}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-subheading tracking-subheading text-heading">
          Sign Guard verdict
        </h3>
        <span className={`${riskBadge[analysis.risk]} uppercase`}>
          {analysis.risk}
        </span>
      </div>
      <p className="mt-3 text-sm font-light leading-relaxed text-body">
        {analysis.summary}
      </p>
      {analysis.flags.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm font-light text-label">
          {analysis.flags.map((flag) => (
            <li key={flag} className="flex gap-2">
              <span className="mt-2 h-1 w-1 flex-none rounded-full bg-purple" />
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 grid gap-3 border-t border-border pt-4">
        <div>
          <p className="stripe-kicker">Programs</p>
          <p className="mt-1 font-mono text-xs tabular-nums text-label">
            {analysis.programs.slice(0, 3).join(" · ") || "Unknown"}
          </p>
        </div>
        <div>
          <p className="stripe-kicker">Accounts</p>
          <p className="mt-1 font-mono text-xs tabular-nums text-label">
            {analysis.accounts.slice(0, 3).join(" · ") || "Unknown"}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          className="stripe-btn-primary"
          onClick={onApprove}
          disabled={!onApprove}
        >
          Sign anyway
        </button>
        <button
          className="stripe-btn-neutral"
          onClick={onReject}
          disabled={!onReject}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
