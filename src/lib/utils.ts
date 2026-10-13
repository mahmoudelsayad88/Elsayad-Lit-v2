export function formatBytes(bytes: number, digits = 1): string {
  if (!bytes || bytes < 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? digits : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatRatio(from: number, to: number): string {
  if (!from || from <= to) return "—";
  return `${(from / to).toFixed(1)}×`;
}

export function formatDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function fileName(ts: number, tag = "ElsayadLite"): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${tag}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes(),
  )}${p(d.getSeconds())}.jpg`;
}

/** يحفظ الصورة في تخزين الجهاز (معرض أندرويد يلتقط مجلد Download تلقائيًا) */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files });
}

export async function shareBlob(blob: Blob, filename: string, text?: string): Promise<"shared" | "saved" | "unsupported"> {
  const file = new File([blob], filename, { type: "image/jpeg" });
  try {
    if (canShareFiles([file])) {
      await navigator.share({ files: [file], title: "Elsayad Lite", text: text ?? "صورة من Elsayad Lite" });
      return "shared";
    }
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return "saved";
  }
  downloadBlob(blob, filename);
  return "unsupported";
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}
