import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { LEVELS, LEVEL_ORDER, type CompressResult, type LevelId } from "@/lib/compress";
import type { PhotoRecord } from "@/lib/db";
import { formatBytes, formatDate, formatRatio } from "@/lib/utils";
import {
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  DownloadIcon,
  InfoIcon,
  ShareIcon,
  SparkleIcon,
  TrashIcon,
  ZapIcon,
} from "@/components/Icons";
import { LevelChips, Stat } from "@/components/ui";

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      aria-label="إغلاق"
      onClick={onClose}
      className="absolute inset-0 bg-ink-950/80 backdrop-blur-md animate-fade"
    />
  );
}

export function ResultSheet({
  result,
  previewUrl,
  saved,
  busy,
  onClose,
  onShare,
  onDownload,
  onRecompress,
}: {
  result: CompressResult;
  previewUrl: string;
  saved: boolean;
  busy: boolean;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
  onRecompress: (level: LevelId) => void;
}) {
  const preset = LEVELS[result.level];
  const [details, setDetails] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <Backdrop onClose={onClose} />
      <div className="relative animate-sheet rounded-t-[32px] border-t border-white/12 bg-ink-900/95 pb-5 shadow-[0_-30px_80px_-30px_rgba(167,139,250,0.6)] backdrop-blur-2xl">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="flex items-center gap-3 px-5 pt-3">
          <span
            className={cn(
              "grid h-10 w-10 place-items-center rounded-2xl border text-[11px] font-black",
              preset.chip,
            )}
          >
            {preset.name.slice(0, 1)}
          </span>
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-white">
              {result.targetMet ? "تم الضغط والحفظ بنجاح" : "تم الضغط (الحجم أقرب ما يمكن)"}
              <CheckIcon width={16} height={16} className="text-emerald-400" strokeWidth={3} />
            </p>
            <p className="text-[11px] font-semibold text-white/50">
              مستوى {preset.name} · {preset.note}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/70 ring-1 ring-white/12"
          >
            <CloseIcon width={17} height={17} />
          </button>
        </div>

        <div className="mt-4 px-5">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/12 bg-ink-950">
            <img src={previewUrl} alt="الصورة الملتقطة" className="max-h-[34vh] w-full object-contain" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
              <ZapIcon width={11} height={11} className="text-sky-glow" />
              {result.width}×{result.height} · JPG
            </div>
          </div>
        </div>

        <div className="mt-4 px-5">
          <div className="rounded-3xl bg-white/[0.05] p-3.5 ring-1 ring-white/8">
            <div className="flex items-end justify-between text-[11px] font-bold">
              <span className="text-white/45">الأصل {formatBytes(result.originalBytes)}</span>
              <span className="text-white/45">
                {formatRatio(result.originalBytes, result.bytes)} أصغر
              </span>
              <span className={cn("bg-gradient-to-l bg-clip-text text-base font-black text-transparent", preset.bar)}>
                {formatBytes(result.bytes)}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full bg-gradient-to-l", preset.bar)}
                style={{ width: `${Math.max(6, 100 - result.savedPercent)}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] font-bold text-emerald-300">
              وفّرت {result.savedPercent}% من الحجم
              {result.targetMet ? "" : " · الحد لم يتحقق فتم تقليل الأبعاد"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 px-5">
          <Stat label="الجودة" value={`${Math.round(result.quality * 100)}%`} accent="text-sky-glow" />
          <Stat label="الأبعاد" value={`${result.width}×${result.height}`} accent="text-kashmiri-soft" />
          <Stat label="الزمن" value={`${result.ms} ms`} accent="text-pink-glow" />
          <Stat label="المحاولات" value={`${result.iterations}`} accent="text-white" />
        </div>

        <div className="mt-4 px-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50">
            <SparkleIcon width={13} height={13} className="text-kashmiri-soft" />
            أعد الضغط بمستوى آخر (من الصورة الأصلية)
          </p>
          <div className={cn(busy && "pointer-events-none opacity-50")}>
            <LevelChips value={result.level} onChange={(l) => l !== result.level && onRecompress(l)} />
            {busy && (
              <p className="mt-2 flex items-center justify-center gap-2 text-[11px] font-bold text-sky-glow">
                <span className="h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-white/20 border-t-sky-glow" />
                جارٍ إعادة الضغط من الصورة الأصلية…
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2.5 px-5">
          <button
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-glow via-kashmiri-soft to-pink-glow py-3.5 text-sm font-extrabold text-ink-950 shadow-[0_16px_40px_-18px_rgba(56,189,248,0.9)] active:scale-[0.98]"
          >
            <ShareIcon width={18} height={18} strokeWidth={2.2} />
            مشاركة الصورة
          </button>
          <button
            onClick={onDownload}
            disabled={saved}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold ring-1 transition-all active:scale-[0.98]",
              saved
                ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
                : "bg-white/8 text-white ring-white/15",
            )}
          >
            {saved ? <CheckIcon width={18} height={18} strokeWidth={2.4} /> : <DownloadIcon width={18} height={18} />}
            {saved ? "محفوظة" : "تنزيل JPG"}
          </button>
        </div>

        <button
          onClick={() => setDetails((d) => !d)}
          className="mx-auto mt-3 flex items-center gap-1 text-[11px] font-bold text-white/45"
        >
          تفاصيل الضغط
          <ChevronIcon width={14} height={14} className={cn("transition-transform", details && "rotate-180")} />
        </button>
        {details && (
          <div className="mx-5 mt-2 animate-fade space-y-1.5 rounded-2xl bg-black/30 p-3 text-[11px] text-white/60 ring-1 ring-white/8">
            <Row k="الأبعاد الأصلية" v={`${result.originalWidth}×${result.originalHeight}`} />
            <Row k="الأبعاد النهائية" v={`${result.width}×${result.height}`} />
            <Row k="جودة JPEG" v={`${(result.quality * 100).toFixed(1)}%`} />
            <Row k="الحد المطلوب" v={`${Math.round(result.targetBytes / 1024)} KB`} />
            <Row k="عدد عمليات الترميز" v={`${result.iterations}`} />
            <Row k="الطريقة" v="تقليل الجودة ثم الأبعاد حتى تحقق الحجم" />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/45">{k}</span>
      <span className="font-bold text-white/85">{v}</span>
    </div>
  );
}

export function PhotoViewer({
  photo,
  url,
  onClose,
  onShare,
  onDownload,
  onDelete,
}: {
  photo: PhotoRecord;
  url: string;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const preset = LEVELS[photo.level];
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink-950/97 backdrop-blur-xl animate-fade">
      <div className="safe-t flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-extrabold text-white">{formatDate(photo.createdAt)}</p>
          <p className={cn("text-[11px] font-bold", preset.chip.split(" ")[1])}>
            {preset.name} · {photo.width}×{photo.height} · {formatBytes(photo.bytes)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-white ring-1 ring-white/12"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-3 py-4">
        <img src={url} alt={photo.name} className="max-h-full max-w-full rounded-3xl object-contain ring-1 ring-white/12" />
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 pb-2 text-center">
        <Stat label="الحجم" value={formatBytes(photo.bytes)} accent="text-sky-glow" />
        <Stat label="الأصل" value={formatBytes(photo.originalBytes)} accent="text-white/70" />
        <Stat label="الجودة" value={`${Math.round(photo.quality * 100)}%`} accent="text-kashmiri-soft" />
        <Stat label="التوفير" value={`${Math.max(0, Math.round((1 - photo.bytes / Math.max(1, photo.originalBytes)) * 100))}%`} accent="text-pink-glow" />
      </div>

      {confirm ? (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-rose-500/12 p-3 ring-1 ring-rose-400/30">
          <InfoIcon width={18} height={18} className="text-rose-300" />
          <span className="flex-1 text-[12px] font-bold text-rose-100">حذف هذه الصورة نهائيًا؟</span>
          <button onClick={onDelete} className="rounded-xl bg-rose-500 px-3 py-1.5 text-[12px] font-bold text-white">
            حذف
          </button>
          <button onClick={() => setConfirm(false)} className="rounded-xl bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white">
            إلغاء
          </button>
        </div>
      ) : (
        <div className="safe-b flex gap-2.5 px-4 pb-5">
          <button
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-glow via-kashmiri-soft to-pink-glow py-3.5 text-sm font-extrabold text-ink-950 active:scale-[0.98]"
          >
            <ShareIcon width={18} height={18} strokeWidth={2.2} /> مشاركة
          </button>
          <button
            onClick={onDownload}
            className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white/8 text-white ring-1 ring-white/15 active:scale-95"
          >
            <DownloadIcon width={20} height={20} />
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25 active:scale-95"
          >
            <TrashIcon width={20} height={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export function LevelHint({ level }: { level: LevelId }) {
  const l = LEVELS[level];
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/45">
      <ZapIcon width={12} height={12} className="text-sky-glow" />
      {LEVEL_ORDER.indexOf(level) + 1}/3 · {l.note}
    </div>
  );
}
