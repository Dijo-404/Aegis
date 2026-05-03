export type VectorRecord = {
  id: string;
  text: string;
  embedding: number[];
  metadata?: {
    signature?: string;
    timestamp?: number;
  };
};

export type VectorStore = {
  records: VectorRecord[];
};

type StoredVectorStore = {
  records: VectorRecord[];
  updatedAt: number;
};

const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const storeKey = (address: string) => `vector-store:${address}`;

export async function createVectorStore(): Promise<VectorStore> {
  return { records: [] };
}

export async function addToStore(store: VectorStore, record: VectorRecord) {
  store.records.push(record);
}

export async function queryStore(
  store: VectorStore,
  embedding: number[],
  topK: number,
) {
  const scored = store.records
    .map((record) => ({
      record,
      score: cosineSimilarity(record.embedding, embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}

export async function loadVectorStore(address: string) {
  const { getStoredValue } = await import("../../lib/storage");
  const stored = await getStoredValue<StoredVectorStore>(storeKey(address));
  return stored?.records ? { records: stored.records } : { records: [] };
}

export async function saveVectorStore(address: string, store: VectorStore) {
  const { setStoredValue } = await import("../../lib/storage");
  const payload: StoredVectorStore = {
    records: store.records,
    updatedAt: Date.now(),
  };
  await setStoredValue(storeKey(address), payload);
}
