import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { TxWarningModal } from './TxWarningModal';
import { useOCR } from './useOCR';
import { useTxExplainer } from './useTxExplainer';

export function SignGuard() {
  const [rawText, setRawText] = useState('');
  const { isProcessing, extractText } = useOCR();
  const { analysis, loading, explain } = useTxExplainer();

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }
    const text = await extractText(file);
    setRawText(text);
  };

  return (
    <SectionCard
      kicker="Sign Guard"
      title="Explain transactions before you sign"
      description="OCR + local LLM analysis for Solana transaction payloads."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Transaction payload</label>
          <textarea
            className="min-h-[220px] rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-ink focus:outline-none"
            placeholder="Paste the serialized transaction or OCR output..."
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void explain(rawText)}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze transaction'}
            </button>
            <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink">
              {isProcessing ? 'Scanning...' : 'Upload QR / screenshot'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {analysis ? (
            <TxWarningModal analysis={analysis} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
              Upload or paste a transaction to see the local risk summary.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
