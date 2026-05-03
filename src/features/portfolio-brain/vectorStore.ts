export type VectorRecord = {
  id: string;
  text: string;
  embedding: number[];
};

export type VectorStore = {
  records: VectorRecord[];
};

export async function createVectorStore(): Promise<VectorStore> {
  return { records: [] };
}

export async function addToStore(store: VectorStore, record: VectorRecord) {
  store.records.push(record);
}

export async function queryStore(store: VectorStore, topK: number) {
  return store.records.slice(0, topK);
}
