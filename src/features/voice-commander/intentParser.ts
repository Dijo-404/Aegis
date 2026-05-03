export type ParsedIntent = {
  action: 'send' | 'swap' | 'stake' | 'query';
  amount?: number;
  token?: string;
  recipient?: string;
  query?: string;
};

export function parseIntent(text: string): ParsedIntent {
  const trimmed = text.trim();
  if (!trimmed) {
    return { action: 'query', query: '' };
  }

  const sendMatch = /send\s+(\d+(?:\.\d+)?)\s+([a-zA-Z0-9]+)\s+to\s+([a-zA-Z0-9]+)/i.exec(trimmed);
  if (sendMatch) {
    return {
      action: 'send',
      amount: Number(sendMatch[1]),
      token: sendMatch[2].toUpperCase(),
      recipient: sendMatch[3],
    };
  }

  if (/balance|recent transactions|spent|spend/i.test(trimmed)) {
    return { action: 'query', query: trimmed };
  }

  return { action: 'query', query: trimmed };
}
