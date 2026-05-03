import { openDB, type DBSchema, type IDBPDatabase } from "idb";

type AegisDB = DBSchema & {
  kv: {
    key: string;
    value: unknown;
  };
};

let dbPromise: Promise<IDBPDatabase<AegisDB>> | null = null;

const getDatabase = () => {
  if (!dbPromise) {
    dbPromise = openDB<AegisDB>("aegis-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });
  }
  return dbPromise;
};

export async function getStoredValue<T>(key: string): Promise<T | undefined> {
  const db = await getDatabase();
  return (await db.get("kv", key)) as T | undefined;
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  const db = await getDatabase();
  await db.put("kv", value, key);
}

export async function deleteStoredValue(key: string): Promise<void> {
  const db = await getDatabase();
  await db.delete("kv", key);
}
