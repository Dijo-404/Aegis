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
  const isExternal = useWalletStore((state) => state.isExternal);

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
      const sig = await signAndBroadcast(transaction, isExternal);
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
      description="Local speech-to-text and intent parsing routed straight into Sign Guard."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <label className="stripe-label">Transcript</label>
          <textarea
            className="stripe-textarea min-h-[180px]"
            placeholder="Type or dictate: Send 20 USDT to 9xK3..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={
                isRecording
                  ? "rounded bg-ruby px-4 py-2 text-base font-normal text-white transition-colors hover:bg-ruby/90 focus:outline-none focus:ring-2 focus:ring-ruby focus:ring-offset-2"
                  : "stripe-btn-primary"
              }
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
            >
              {isRecording ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Stop recording
                </span>
              ) : (
                "Start recording"
              )}
            </button>
            <button
              className="stripe-btn-neutral"
              onClick={buildAndAnalyze}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing..." : "Analyze transfer"}
            </button>
            {intent.action === "query" && (
              <button className="stripe-btn-ghost" onClick={handlePortfolioQuery}>
                Ask Portfolio Brain
              </button>
            )}
          </div>
          {recordingError && (
            <p className="rounded border border-ruby/30 bg-ruby/5 px-3 py-2 text-sm font-light text-ruby">
              {recordingError}
            </p>
          )}
          {transactionError && (
            <p className="rounded border border-ruby/30 bg-ruby/5 px-3 py-2 text-sm font-light text-ruby">
              {transactionError}
            </p>
          )}
        </div>
        <div className="rounded-md border border-border bg-white p-5 shadow-ambient">
          <p className="stripe-kicker">Parsed intent</p>
          <p className="mt-2 text-subheading tracking-subheading text-heading">
            {preview.label}
          </p>
          <p className="mt-2 text-sm font-light leading-relaxed text-body">
            {preview.details}
          </p>
          {preview.warning && (
            <p className="mt-3 rounded border border-lemon/30 bg-lemon/5 px-3 py-2 text-sm font-light text-lemon">
              {preview.warning}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="stripe-dashed rounded-md bg-purple/[0.02] p-5 text-sm font-light text-body">
          {isTranscribing
            ? "Transcribing audio locally..."
            : "Record a command — Whisper produces the transcript, then Sign Guard reviews it."}
        </div>
        <div>
          {analysis ? (
            <TxWarningModal
              analysis={analysis}
              onApprove={() => void handleSign()}
              onReject={reset}
            />
          ) : (
            <div className="stripe-dashed flex min-h-[160px] flex-col items-center justify-center rounded-md bg-purple/[0.02] p-6 text-center">
              <p className="stripe-kicker mb-1">No verdict yet</p>
              <p className="text-sm font-light text-body">
                Build a transfer to see the Sign Guard verdict.
              </p>
            </div>
          )}
        </div>
      </div>

      {signature && (
        <div className="mt-4 flex items-start gap-3 rounded border border-success/40 bg-success/10 p-4">
          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-success" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-normal text-success-text">
              Transaction sent
            </p>
            <p className="break-all font-mono text-xs tabular-nums text-success-text/80">
              {signature}
            </p>
          </div>
        </div>
      )}

      {signing && (
        <div className="mt-4 rounded border border-border bg-white p-4 text-sm font-light text-body">
          Broadcasting transaction...
        </div>
      )}
    </SectionCard>
  );
}
