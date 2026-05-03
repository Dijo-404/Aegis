import { useMemo, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { buildTxPreview } from './txBuilder';
import { parseIntent } from './intentParser';

export function VoiceCommander() {
  const [transcript, setTranscript] = useState('');

  const intent = useMemo(() => parseIntent(transcript), [transcript]);
  const preview = useMemo(() => buildTxPreview(intent), [intent]);

  return (
    <SectionCard
      kicker="Voice Commander"
      title="Speak your transaction"
      description="Local speech-to-text and intent parsing routed into Sign Guard."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Transcript</label>
          <textarea
            className="min-h-[180px] rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-ink focus:outline-none"
            placeholder="Type or dictate: Send 20 USDT to 9xK3..."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
            Microphone capture hooks into QVAC Whisper next. This is the intent parser preview.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Parsed intent</p>
          <p className="mt-2 text-lg font-semibold text-ink">{preview.label}</p>
          <p className="mt-2 text-sm text-slate-600">{preview.details}</p>
          {preview.warning && <p className="mt-3 text-sm text-amber-600">{preview.warning}</p>}
        </div>
      </div>
    </SectionCard>
  );
}
