import type { ParsedIntent } from './intentParser';

export type TxPreview = {
  label: string;
  details: string;
  warning?: string;
};

export function buildTxPreview(intent: ParsedIntent): TxPreview {
  if (intent.action === 'send' && intent.amount && intent.token && intent.recipient) {
    return {
      label: 'Transfer preview',
      details: `Send ${intent.amount} ${intent.token} to ${intent.recipient}.`,
    };
  }

  if (intent.action === 'query') {
    return {
      label: 'Portfolio query',
      details: intent.query?.length ? intent.query : 'Ask a portfolio question to continue.',
    };
  }

  return {
    label: 'Intent not ready',
    details: 'Provide a clear send or query command.',
    warning: 'Voice intent needs more detail.',
  };
}
