import { useState } from "react";
import { SectionCard } from "../../components/SectionCard";
import { TxWarningModal } from "./TxWarningModal";
import { useOCR } from "./useOCR";
import { useTxExplainer } from "./useTxExplainer";
import { useWalletStore } from "../wallet/useWallet";

export function SignGuard() {
  const [rawText, setRawText] = useState("");
  const { isProcessing, extractText } = useOCR();
  const { analysis, loading, explain, reset } = useTxExplainer();
  const walletAddress = useWalletStore((state) => state.address);

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
      description="OCR + local LLM analysis for Solana transaction payloads. Nothing leaves the device."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-3">
          <label className="stripe-label">Transaction payload</label>
          <textarea
            className="stripe-textarea min-h-[220px] font-mono text-sm leading-relaxed"
            placeholder="Paste the serialized transaction or OCR output..."
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="stripe-btn-primary"
              onClick={() => void explain({ rawText, walletAddress })}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze transaction"}
            </button>
            <label className="stripe-btn-neutral cursor-pointer">
              {isProcessing ? "Scanning..." : "Upload QR / screenshot"}
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
            <TxWarningModal analysis={analysis} onReject={reset} />
          ) : (
            <div className="stripe-dashed flex min-h-[220px] flex-col items-center justify-center rounded-md bg-purple/[0.02] p-6 text-center">
              <p className="stripe-kicker mb-2">Awaiting input</p>
              <p className="text-sm font-light leading-relaxed text-body">
                Upload or paste a transaction to see the local risk summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
