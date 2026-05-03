import { useState } from 'react';

export type TxRisk = 'safe' | 'warning' | 'danger';

export type TxAnalysis = {
  summary: string;
  risk: TxRisk;
  flags: string[];
};

export function useTxExplainer() {
  const [analysis, setAnalysis] = useState<TxAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async (rawText: string) => {
    setLoading(true);
    try {
      if (!rawText.trim()) {
        setAnalysis(null);
        return;
      }

      const lower = rawText.toLowerCase();
      const flags: string[] = [];

      if (lower.includes('setauthority') || lower.includes('set authority')) {
        flags.push('setAuthority detected (ownership change)');
      }
      if (lower.includes('approve') && lower.includes('max')) {
        flags.push('Unlimited approve pattern');
      }
      if (lower.includes('delegate')) {
        flags.push('Delegate instruction present');
      }
      if (lower.includes('unknown program')) {
        flags.push('Unknown program id in payload');
      }

      const risk: TxRisk = flags.length === 0 ? 'safe' : flags.length >= 2 ? 'danger' : 'warning';

      setAnalysis({
        summary:
          risk === 'safe'
            ? 'No obvious red flags detected. Review details before signing.'
            : 'Potentially risky instructions found. Confirm intent before signing.',
        risk,
        flags: flags.length ? flags : ['No suspicious patterns detected.'],
      });
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, explain };
}
