import { useState } from 'react';

export type EmbeddingStatus = 'idle' | 'indexing' | 'ready';

export function useEmbeddings() {
  const [status, setStatus] = useState<EmbeddingStatus>('idle');

  const buildIndex = async () => {
    setStatus('indexing');
    setStatus('ready');
  };

  return { status, buildIndex };
}
