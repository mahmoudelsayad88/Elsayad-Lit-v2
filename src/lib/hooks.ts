import { useCallback, useEffect, useRef, useState } from "react";
import { clearPhotos, listPhotos, removePhoto, savePhoto, type PhotoRecord } from "@/lib/db";
import { uid } from "@/lib/utils";

export interface NewPhotoInput extends Omit<PhotoRecord, "id"> {}

export function useGallery() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const urls = useRef(new Map<string, string>());

  useEffect(() => {
    let alive = true;
    listPhotos().then((list) => {
      if (!alive) return;
      setPhotos(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const urlOf = useCallback((photo: PhotoRecord) => {
    let u = urls.current.get(photo.id);
    if (!u) {
      u = URL.createObjectURL(photo.blob);
      urls.current.set(photo.id, u);
    }
    return u;
  }, []);

  const add = useCallback(async (input: NewPhotoInput) => {
    const record: PhotoRecord = { ...input, id: uid() };
    await savePhoto(record);
    setPhotos((prev) => [record, ...prev]);
    return record;
  }, []);

  const remove = useCallback(async (id: string) => {
    await removePhoto(id);
    const u = urls.current.get(id);
    if (u) {
      URL.revokeObjectURL(u);
      urls.current.delete(id);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await clearPhotos();
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current.clear();
    setPhotos([]);
  }, []);

  const totals = photos.reduce(
    (acc, p) => {
      acc.bytes += p.bytes;
      acc.originalBytes += p.originalBytes;
      return acc;
    },
    { bytes: 0, originalBytes: 0 },
  );

  return { photos, loading, urlOf, add, remove, clear, totals };
}

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? ({ ...(initial as object), ...JSON.parse(raw) } as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  const patch = useCallback((partial: Partial<T>) => {
    setValue((prev) => ({ ...(prev as object), ...(partial as object) } as T));
  }, []);

  return [value, patch, setValue] as const;
}
