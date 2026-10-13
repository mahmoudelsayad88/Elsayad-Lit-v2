/**
 * Elsayad Lite — محرّك الضغط التكيفي (Adaptive JPEG engine)
 *
 * الفكرة: نحاول الحصول على أصغر ملف ممكن دون تجاوز الحد المطلوب،
 * وذلك بتقليل "جودة" الترميز أولًا (binary search) ثم تقليل الأبعاد
 * تدريجيًا فقط إذا لم يكفِ ذلك.
 */

export type LevelId = "low" | "medium" | "high";

export interface LevelPreset {
  id: LevelId;
  name: string;
  nameAr: string;
  note: string;
  /** الحد الأقصى للحجم بالبايت */
  targetBytes: number;
  /** أقصى بُعد (الطول الأكبر) نبدأ به */
  startDim: number;
  /** أقل بُعد نصل إليه قبل الاستسلام */
  minDim: number;
  qStart: number;
  qMin: number;
  qMax: number;
  desc: string;
  ring: string;
  chip: string;
  bar: string;
  glow: string;
}

export const KB = 1024;

export const LEVELS: Record<LevelId, LevelPreset> = {
  low: {
    id: "low",
    name: "Low",
    nameAr: "منخفض",
    note: "أقل من 250 KB",
    targetBytes: 250 * KB,
    startDim: 1440,
    minDim: 620,
    qStart: 0.78,
    qMin: 0.34,
    qMax: 0.82,
    desc: "أصغر حجم ممكن — مثالي للواتساب والرسائل السريعة.",
    ring: "ring-sky-glow/60",
    chip: "bg-sky-glow/15 text-sky-glow border-sky-glow/40",
    bar: "from-sky-glow to-blue-glow",
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.9)]",
  },
  medium: {
    id: "medium",
    name: "Medium",
    nameAr: "متوسط",
    note: "جودة وحجم متوازن",
    targetBytes: 620 * KB,
    startDim: 2048,
    minDim: 860,
    qStart: 0.86,
    qMin: 0.45,
    qMax: 0.9,
    desc: "توازن ممتاز بين وضوح الصورة وحجم الملف.",
    ring: "ring-kashmiri-soft/60",
    chip: "bg-kashmiri/20 text-kashmiri-soft border-kashmiri-soft/40",
    bar: "from-kashmiri-soft to-pink-glow",
    glow: "shadow-[0_0_40px_-12px_rgba(167,139,250,0.9)]",
  },
  high: {
    id: "high",
    name: "High",
    nameAr: "عالي",
    note: "أعلى جودة · بحد أقصى 300 KB",
    targetBytes: 300 * KB,
    startDim: 3200,
    minDim: 1080,
    qStart: 0.97,
    qMin: 0.6,
    qMax: 0.97,
    desc: "نحافظ على أكبر أبعاد ممكنة ونخفض الجودة فقط حتى 300 KB.",
    ring: "ring-pink-glow/60",
    chip: "bg-pink-glow/15 text-pink-glow border-pink-glow/40",
    bar: "from-pink-glow to-blue-deep",
    glow: "shadow-[0_0_40px_-12px_rgba(244,114,182,0.9)]",
  },
};

export const LEVEL_ORDER: LevelId[] = ["low", "medium", "high"];

export interface CompressResult {
  blob: Blob;
  bytes: number;
  width: number;
  height: number;
  quality: number;
  iterations: number;
  ms: number;
  targetBytes: number;
  targetMet: boolean;
  level: LevelId;
  originalBytes: number;
  originalWidth: number;
  originalHeight: number;
  savedPercent: number;
  thumb: string;
}

interface RawSource {
  src: CanvasImageSource;
  width: number;
  height: number;
  bytes: number;
  close: () => void;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل ترميز الصورة"))),
      "image/jpeg",
      quality,
    );
  });
}

/** تصغير عالي الجودة عبر خطوات نصفية لتجنّب التشوّه */
function render(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  targetW: number,
  targetH: number,
  mirror: boolean,
): HTMLCanvasElement {
  let cw = sw;
  let ch = sh;
  let current: HTMLCanvasElement | null = null;

  const draw = (w: number, h: number, from: CanvasImageSource) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext("2d", { alpha: false })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (mirror) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(from, 0, 0, c.width, c.height);
    return c;
  };

  // halving pass
  while (cw / 2 >= targetW && ch / 2 >= targetH) {
    cw = cw / 2;
    ch = ch / 2;
    current = draw(cw, ch, current ?? source);
  }

  const finalCanvas = draw(targetW, targetH, current ?? source);
  return finalCanvas;
}

function fit(sw: number, sh: number, maxDim: number) {
  const largest = Math.max(sw, sh);
  const scale = largest > maxDim ? maxDim / largest : 1;
  return { w: Math.max(1, Math.round(sw * scale)), h: Math.max(1, Math.round(sh * scale)) };
}

export async function loadRawSource(blob: Blob): Promise<RawSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return {
        src: bmp,
        width: bmp.width,
        height: bmp.height,
        bytes: blob.size,
        close: () => bmp.close(),
      };
    } catch {
      /* fallback below */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
      i.src = url;
    });
    return {
      src: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      bytes: blob.size,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** يبحث عن أعلى جودة لا تتجاوز الحد المستهدف داخل نفس الأبعاد */
async function bestQuality(
  canvas: HTMLCanvasElement,
  target: number,
  qMin: number,
  qMax: number,
  counter: { n: number },
): Promise<{ blob: Blob; quality: number; met: boolean }> {
  const lowBlob = await toBlob(canvas, qMin);
  counter.n++;
  if (lowBlob.size > target) return { blob: lowBlob, quality: qMin, met: false };

  const highBlob = await toBlob(canvas, qMax);
  counter.n++;
  if (highBlob.size <= target) return { blob: highBlob, quality: qMax, met: true };

  let lo = qMin;
  let hi = qMax;
  let best = { blob: lowBlob, quality: qMin };
  for (let i = 0; i < 6 && hi - lo > 0.012; i++) {
    const mid = (lo + hi) / 2;
    const blob = await toBlob(canvas, mid);
    counter.n++;
    if (blob.size <= target) {
      best = { blob, quality: mid };
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { ...best, met: true };
}

export interface CompressOptions {
  level: LevelId;
  mirror?: boolean;
  /** إلغاء تجاوز الحد (يستخدم دائمًا true افتراضيًا) */
  strict?: boolean;
}

/**
 * الضغط التكيفي: جودة ⟶ أبعاد ⟶ جودة ⟶ أبعاد … حتى تحقيق الحجم.
 */
export async function compressImage(
  blob: Blob,
  options: CompressOptions,
): Promise<CompressResult> {
  const preset = LEVELS[options.level];
  const mirror = options.mirror ?? false;
  const started = performance.now();
  const raw = await loadRawSource(blob);

  try {
    const counter = { n: 0 };
    let dim = Math.min(preset.startDim, Math.max(raw.width, raw.height));
    let winner: { blob: Blob; quality: number; met: boolean; w: number; h: number } | null = null;

    for (let attempt = 0; attempt < 9; attempt++) {
      const { w, h } = fit(raw.width, raw.height, dim);
      const canvas = render(raw.src, raw.width, raw.height, w, h, mirror);
      const res = await bestQuality(canvas, preset.targetBytes, preset.qMin, preset.qMax, counter);
      winner = { blob: res.blob, quality: res.quality, met: res.met, w, h };

      if (res.met || dim <= preset.minDim || !options.strict) break;
      // حراسة زمنية: لا نتجاوز ~7 ثوانٍ على الأجهزة الضعيفة
      if (performance.now() - started > 7000) break;

      const next = Math.max(preset.minDim, Math.round(dim * 0.82));
      if (next >= dim) break;
      dim = next;
    }

    const result = winner!;
    const ms = Math.round(performance.now() - started);
    const saved = raw.bytes > 0 ? Math.max(0, Math.round((1 - result.blob.size / raw.bytes) * 100)) : 0;

    // مصغّرة سريعة للمعرض
    let thumb = "";
    try {
      const img = await loadRawSource(result.blob);
      const tc = render(
        img.src,
        img.width,
        img.height,
        260,
        Math.max(1, Math.round((img.height / img.width) * 260)),
        false,
      );
      thumb = tc.toDataURL("image/jpeg", 0.6);
      img.close();
    } catch {
      thumb = "";
    }

    return {
      blob: result.blob,
      bytes: result.blob.size,
      width: result.w,
      height: result.h,
      quality: result.quality,
      iterations: counter.n,
      ms,
      targetBytes: preset.targetBytes,
      targetMet: result.met,
      level: preset.id,
      originalBytes: raw.bytes,
      originalWidth: raw.width,
      originalHeight: raw.height,
      savedPercent: saved,
      thumb,
    };
  } finally {
    raw.close();
  }
}

/** يحوّل نتيجة الضغط إلى ملف JPG جاهز للحفظ/المشاركة */
export function resultToFile(result: CompressResult, name: string): File {
  return new File([result.blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
