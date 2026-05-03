import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../../components/SectionCard";
import { TxWarningModal } from "../sign-guard/TxWarningModal";
import { useTxExplainer } from "../sign-guard/useTxExplainer";
import { useWalletStore } from "../wallet/useWallet";
import { signAndBroadcast } from "../wallet/wdk.config";
import { buildTransactionFromIntent, buildTxPreview } from "./txBuilder";
import { parseIntent } from "./intentParser";
import { useWhisper } from "./useWhisper";

const QUERY_KEY = "aegis:portfolioQuery";

export function VoiceCommander() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | undefined>();
  const [transactionError, setTransactionError] = useState<
    string | undefined
  >();
  const [signature, setSignature] = useState<string | undefined>();
  const [signing, setSigning] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { isTranscribing, transcribe } = useWhisper();
  const { analysis, loading: analyzing, explain, reset } = useTxExplainer();
  const walletAddress = useWalletStore((state) => state.address);

  const intent = useMemo(() => parseIntent(transcript), [transcript]);
  const preview = useMemo(() => buildTxPreview(intent), [intent]);

  const startRecording = async () => {
    setRecordingError(undefined);
    setSignature(undefined);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordingError("Audio capture is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const text = await transcribe(blob);
        if (text.trim()) {
          setTranscript(text.trim());
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Microphone access denied.";
      setRecordingError(message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const buildAndAnalyze = async () => {
    setTransactionError(undefined);
    setSignature(undefined);
    try {
      const transaction = await buildTransactionFromIntent(intent);
      if (!transaction) {
        setTransactionError("Provide a send command to build a transaction.");
        return;
      }
      await explain({ transaction, walletAddress });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build transaction.";
      setTransactionError(message);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const transaction = await buildTransactionFromIntent(intent);
      if (!transaction) {
        setTransactionError("Unable to sign without a transaction payload.");
        return;
      }
      const sig = await signAndBroadcast(transaction);
      setSignature(sig);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign transaction.";
      setTransactionError(message);
    } finally {
      setSigning(false);
    }
  };

  const handlePortfolioQuery = () => {
    if (intent.action !== "query" || !intent.query) {
      return;
    }
    sessionStorage.setItem(QUERY_KEY, intent.query);
    navigate("/chat");
  };

  return (
    <SectionCard
      kicker="Voice Commander"
      title="Speak your transaction"
      description="Local speech-to-text and intent parsing routed into Sign Guard."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Transcript
          </label>
          <textarea
            className="min-h-[180px] rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-ink focus:outline-none"
            placeholder="Type or dictate: Send 20 USDT to 9xK3..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
            >
              {isRecording ? "Stop recording" : "Start recording"}
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink"
              onClick={buildAndAnalyze}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing..." : "Analyze transfer"}
            </button>
            {intent.action === "query" && (
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink"
                onClick={handlePortfolioQuery}
              >
                Ask Portfolio Brain
              </button>
            )}
          </div>
          {recordingError && (
            <p className="text-sm text-rose-600">{recordingError}</p>
          )}
          {transactionError && (
            <p className="text-sm text-rose-600">{transactionError}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Parsed intent
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">{preview.label}</p>
          <p className="mt-2 text-sm text-slate-600">{preview.details}</p>
          {preview.warning && (
            <p className="mt-3 text-sm text-amber-600">{preview.warning}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-5 text-sm text-slate-500">
          {isTranscribing
            ? "Transcribing audio locally..."
            : "Record a command to let Whisper produce the transcript, then analyze with Sign Guard."}
        </div>
        <div>
          {analysis ? (
            <TxWarningModal
              analysis={analysis}
              onApprove={() => void handleSign()}
              onReject={reset}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
              Build a transfer to see the Sign Guard verdict.
            </div>
          )}
        </div>
      </div>

      {signature && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Transaction sent: {signature}
        </div>
      )}

      {signing && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
          Broadcasting transaction...
        </div>
      )}
    </SectionCard>
  );
}
