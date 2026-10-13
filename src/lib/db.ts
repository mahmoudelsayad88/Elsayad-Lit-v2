import type { LevelId } from "./compress";

export interface PhotoRecord {
  id: string;
  name: string;
  blob: Blob;
  thumb: string;
  createdAt: number;
  bytes: number;
  width: number;
  height: number;
  quality: number;
  originalBytes: number;
  originalWidth: number;
  originalHeight: number;
  ms: number;
  iterations: number;
  targetMet: boolean;
  level: LevelId;
  source: "camera" | "front" | "import";
}

const DB_NAME = "elsayad-lite";
const STORE = "photos";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  try {
    const all = await tx<PhotoRecord[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function savePhoto(record: PhotoRecord): Promise<void> {
  await tx("readwrite", (s) => s.put(record));
}

export async function removePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearPhotos(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}

export async function estimateUsage(): Promise<{ usage: number; quota: number }> {
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  }
  return { usage: 0, quota: 0 };
}
