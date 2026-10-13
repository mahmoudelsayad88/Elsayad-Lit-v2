import { useState } from "react";
import { cn } from "@/utils/cn";
import { LEVELS } from "@/lib/compress";
import type { PhotoRecord } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { GalleryIcon, ImageUpIcon, InfoIcon, SparkleIcon, TrashIcon } from "@/components/Icons";
import { Card, Stat } from "@/components/ui";

interface Props {
  photos: PhotoRecord[];
  loading: boolean;
  urlOf: (p: PhotoRecord) => string;
  onOpen: (p: PhotoRecord) => void;
  onImport: () => void;
  onClear: () => void;
  onGoCamera: () => void;
}

export default function GalleryScreen({
  photos,
  loading,
  urlOf,
  onOpen,
  onImport,
  onClear,
  onGoCamera,
}: Props) {
  const [confirm, setConfirm] = useState(false);
  const totals = photos.reduce(
    (a, p) => ({ bytes: a.bytes + p.bytes, original: a.original + p.originalBytes }),
    { bytes: 0, original: 0 },
  );
  const saved = Math.max(0, totals.original - totals.bytes);
  const savedPct = totals.original ? Math.round((saved / totals.original) * 100) : 0;

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-6">
      <Card className="mb-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-glow/25 to-pink-glow/25 text-sky-glow ring-1 ring-white/12">
            <SparkleIcon width={22} height={22} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold text-white">معرض Elsayad Lite</p>
            <p className="text-[11px] font-semibold text-white/50">كل الصور محفوظة بصيغة JPG على جهازك</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="صورة" value={String(photos.length)} accent="text-sky-glow" />
          <Stat label="الحجم الكلي" value={formatBytes(totals.bytes)} accent="text-kashmiri-soft" />
          <Stat label="التوفير" value={`${savedPct}%`} accent="text-pink-glow" />
        </div>
        {saved > 0 && (
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-300">
            <InfoIcon width={13} height={13} />
            وفّرت {formatBytes(saved)} من مساحة جهازك بفضل الضغط التكيفي
          </p>
        )}
      </Card>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="mt-6 grid place-items-center px-6 text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-sky-glow/20 via-kashmiri/20 to-pink-glow/20 ring-1 ring-white/12">
            <GalleryIcon width={34} height={34} className="text-sky-glow" />
          </div>
          <p className="text-base font-extrabold text-white">المعرض فارغ</p>
          <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-white/50">
            التقط أول صورة بالكاميرا الداخلية، أو استورد صورة موجودة لضغطها بمستوى Low أو Medium أو High.
          </p>
          <div className="mt-5 flex w-full max-w-[280px] flex-col gap-2">
            <button
              onClick={onGoCamera}
              className="rounded-2xl bg-gradient-to-r from-sky-glow via-kashmiri-soft to-pink-glow py-3 text-sm font-extrabold text-ink-950 active:scale-[0.98]"
            >
              افتح الكاميرا
            </button>
            <button
              onClick={onImport}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 py-3 text-sm font-bold text-white ring-1 ring-white/15 active:scale-[0.98]"
            >
              <ImageUpIcon width={18} height={18} /> استيراد صورة للضغط
            </button>
          </div>
        </div>
      ) : (
        <>
          {confirm ? (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-rose-500/12 p-3 ring-1 ring-rose-400/30">
              <TrashIcon width={18} height={18} className="text-rose-300" />
              <span className="flex-1 text-[12px] font-bold text-rose-100">حذف كل الصور؟</span>
              <button onClick={onClear} className="rounded-xl bg-rose-500 px-3 py-1.5 text-[12px] font-bold text-white">
                حذف الكل
              </button>
              <button onClick={() => setConfirm(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white">
                إلغاء
              </button>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold text-white/40">أحدث الصور أولًا</p>
              <div className="flex gap-2">
                <button onClick={onImport} className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold text-white/80 ring-1 ring-white/12">
                  استيراد
                </button>
                <button
                  onClick={() => setConfirm(true)}
                  className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[11px] font-bold text-rose-300 ring-1 ring-rose-400/25"
                >
                  حذف الكل
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => {
              const preset = LEVELS[p.level];
              return (
                <button
                  key={p.id}
                  onClick={() => onOpen(p)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10 transition-transform active:scale-95"
                >
                  <img
                    src={p.thumb || urlOf(p)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 rounded-full border bg-black/55 px-1.5 py-0.5 text-[9px] font-black backdrop-blur",
                      preset.chip,
                    )}
                  >
                    {preset.name}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[9px] font-bold text-white/90">
                    {formatBytes(p.bytes)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
