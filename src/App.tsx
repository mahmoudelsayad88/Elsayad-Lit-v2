import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { compressImage, LEVELS, type CompressResult, type LevelId } from "@/lib/compress";
import type { PhotoRecord } from "@/lib/db";
import { useGallery, usePersistentState } from "@/lib/hooks";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings } from "@/lib/settings";
import { fileName, formatBytes } from "@/lib/utils";
import { saveJpg, shareJpg } from "@/lib/native";
import CameraScreen from "@/components/CameraScreen";
import GalleryScreen from "@/components/GalleryScreen";
import SettingsScreen from "@/components/SettingsScreen";
import { PhotoViewer, ResultSheet } from "@/components/PhotoSheets";
import { Aurora } from "@/components/ui";
import {
  CameraIcon,
  CheckIcon,
  GalleryIcon,
  ImageUpIcon,
  ShareIcon,
  SlidersIcon,
  SparkleIcon,
  ZapIcon,
} from "@/components/Icons";

type Tab = "camera" | "gallery" | "settings";

interface Pending {
  result: CompressResult;
  raw: Blob;
  url: string;
  name: string;
  savedId: string | null;
  downloaded: boolean;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("camera");
  const [settings, patchSettings] = usePersistentState<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const gallery = useGallery();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "warn" } | null>(null);
  const [viewing, setViewing] = useState<PhotoRecord | null>(null);
  const [intro, setIntro] = useState(() => !localStorage.getItem("elsayad-lite:seen"));
  const importRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((msg: string, tone: "ok" | "warn" = "ok") => {
    setToast({ msg, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const saveRecord = useCallback(
    async (result: CompressResult, name: string, source: "camera" | "front" | "import") => {
      const record = await gallery.add({
        name,
        blob: result.blob,
        thumb: result.thumb,
        createdAt: Date.now(),
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        quality: result.quality,
        originalBytes: result.originalBytes,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        ms: result.ms,
        iterations: result.iterations,
        targetMet: result.targetMet,
        level: result.level,
        source,
      });
      return record.id;
    },
    [gallery],
  );

  const processCapture = useCallback(
    async (raw: Blob, source: "camera" | "front" | "import") => {
      setBusy("جارٍ الضغط التكيفي…");
      try {
        const result = await compressImage(raw, { level: settings.level, mirror: false });
        const name = fileName(Date.now());
        const savedId = settings.autoSave ? await saveRecord(result, name, source) : null;
        if (settings.autoDownload) {
          const how = await saveJpg(result.blob, name);
          notify(
            `${how === "gallery" ? "حُفظت في معرض الجهاز" : "تم تنزيل الصورة"} (${formatBytes(
              result.bytes,
            )}) · وفّرت ${result.savedPercent}%`,
          );
        } else {
          notify(`جاهزة · ${formatBytes(result.bytes)} · وفّرت ${result.savedPercent}%`);
        }
        if (pending?.url) URL.revokeObjectURL(pending.url);
        setPending({ result, raw, url: URL.createObjectURL(result.blob), name, savedId, downloaded: settings.autoDownload });
        if (settings.autoShare) {
          const r = await shareJpg(result.blob, name);
          if (r === "shared") notify("تم فتح نافذة المشاركة");
          if (r === "unsupported") notify("المشاركة غير مدعومة — تم حفظ الصورة بدلًا منها", "warn");
        }
      } catch (e) {
        notify("تعذّر معالجة الصورة، حاول مرة أخرى", "warn");
        console.error(e);
      } finally {
        setBusy(null);
      }
    },
    [notify, pending?.url, saveRecord, settings.autoDownload, settings.autoSave, settings.autoShare, settings.level],
  );

  const recompress = useCallback(
    async (level: LevelId) => {
      if (!pending) return;
      setBusy("إعادة الضغط…");
      try {
        const result = await compressImage(pending.raw, { level, mirror: false });
        const name = fileName(Date.now());
        if (pending.savedId) await gallery.remove(pending.savedId);
        const savedId = settings.autoSave ? await saveRecord(result, name, "camera") : null;
        if (pending.url) URL.revokeObjectURL(pending.url);
        setPending({
          result,
          raw: pending.raw,
          url: URL.createObjectURL(result.blob),
          name,
          savedId,
          downloaded: false,
        });
        patchSettings({ level });
        notify(`مستوى ${LEVELS[level].name} · ${formatBytes(result.bytes)}`);
      } catch {
        notify("فشلت إعادة الضغط", "warn");
      } finally {
        setBusy(null);
      }
    },
    [gallery, notify, patchSettings, pending, saveRecord, settings.autoSave],
  );

  const sharePending = useCallback(async () => {
    if (!pending) return;
    const r = await shareJpg(pending.result.blob, pending.name);
    if (r === "shared") notify("تمت المشاركة 🎉");
    else if (r === "unsupported") notify("المشاركة غير مدعومة — تم حفظ الصورة", "warn");
  }, [notify, pending]);

  const downloadPending = useCallback(async () => {
    if (!pending) return;
    const how = await saveJpg(pending.result.blob, pending.name);
    setPending({ ...pending, downloaded: true });
    notify(how === "gallery" ? "حُفظت في معرض الجهاز (JPG)" : "تم تنزيل الصورة بصيغة JPG");
  }, [notify, pending]);

  const closePending = useCallback(() => {
    if (pending?.url) URL.revokeObjectURL(pending.url);
    setPending(null);
  }, [pending]);

  const clearAll = useCallback(async () => {
    await gallery.clear();
    notify("تم حذف جميع الصور", "warn");
  }, [gallery, notify]);

  useEffect(() => {
    return () => {
      if (pending?.url) URL.revokeObjectURL(pending.url);
    };
  }, [pending?.url]);

  const lastThumb = gallery.photos[0]?.thumb;
  const preset = LEVELS[settings.level];

  return (
    <div className="relative flex h-full min-h-screen w-full justify-center overflow-hidden bg-ink-950">
      <Aurora className="opacity-70" />

      {/* إطار الهاتف */}
      <div className="relative z-10 flex h-[100dvh] w-full max-w-[460px] flex-col overflow-hidden border-white/8 bg-ink-950/70 shadow-[0_0_120px_-40px_rgba(56,189,248,0.55)] backdrop-blur-2xl sm:my-0 sm:border-x">
        {/* التطبيق شريط علوي */}
        <header className="safe-t relative z-20 shrink-0 px-4 pb-2 pt-3">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-glow via-kashmiri-soft to-pink-glow shadow-[0_10px_30px_-12px_rgba(167,139,250,0.9)]">
              <CameraIcon width={22} height={22} className="text-ink-950" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <h1 className="text-[17px] font-black leading-tight tracking-tight text-white">
                Elsayad <span className="text-aurora">Lite</span>
              </h1>
              <p className="flex items-center gap-1 text-[10px] font-bold text-white/45">
                <ZapIcon width={11} height={11} className="text-sky-glow" />
                {preset.name} · {preset.note}
              </p>
            </div>
            <button
              onClick={() => setTab("gallery")}
              className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[11px] font-extrabold text-white/80 ring-1 ring-white/12"
            >
              <GalleryIcon width={14} height={14} />
              {gallery.photos.length}
            </button>
          </div>
        </header>

        {/* المحتوى */}
        <main className="relative z-10 min-h-0 flex-1 pt-1">
          {tab === "camera" && (
            <CameraScreen
              settings={settings}
              onLevelChange={(level) => patchSettings({ level })}
              onPatch={patchSettings}
              onCapture={processCapture}
              busy={!!busy}
              lastThumb={lastThumb}
              onOpenLast={() => gallery.photos[0] && setViewing(gallery.photos[0])}
            />
          )}
          {tab === "gallery" && (
            <GalleryScreen
              photos={gallery.photos}
              loading={gallery.loading}
              urlOf={gallery.urlOf}
              onOpen={setViewing}
              onImport={() => importRef.current?.click()}
              onClear={clearAll}
              onGoCamera={() => setTab("camera")}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              settings={settings}
              onPatch={patchSettings}
              totals={gallery.totals}
              photoCount={gallery.photos.length}
              onClear={clearAll}
            />
          )}
        </main>

        {/* شريط التنقل */}
        <nav className="safe-b relative z-20 shrink-0 px-4 pb-3 pt-1">
          <div className="flex items-center gap-1 rounded-3xl bg-ink-850/85 p-1.5 ring-1 ring-white/10 backdrop-blur-xl">
            {(
              [
                { id: "camera", label: "الكاميرا", Icon: CameraIcon },
                { id: "gallery", label: "المعرض", Icon: GalleryIcon },
                { id: "settings", label: "الضغط", Icon: SlidersIcon },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 transition-all duration-300",
                    active
                      ? "bg-gradient-to-b from-white/15 to-white/5 ring-1 ring-white/15"
                      : "text-white/45",
                  )}
                >
                  <Icon
                    width={20}
                    height={20}
                    className={cn(active ? "text-sky-glow" : "")}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-extrabold",
                      active ? "bg-gradient-to-l from-sky-glow via-kashmiri-soft to-pink-glow bg-clip-text text-transparent" : "text-white/45",
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* نافذة النتيجة */}
        {pending && (
          <ResultSheet
            result={pending.result}
            previewUrl={pending.url}
            saved={pending.downloaded}
            busy={!!busy}
            onClose={closePending}
            onShare={sharePending}
            onDownload={downloadPending}
            onRecompress={recompress}
          />
        )}

        {/* عارض الصور */}
        {viewing && (
          <PhotoViewer
            photo={viewing}
            url={gallery.urlOf(viewing)}
            onClose={() => setViewing(null)}
            onShare={async () => {
              const r = await shareJpg(viewing.blob, viewing.name);
              if (r === "shared") notify("تمت المشاركة 🎉");
              else if (r === "unsupported") notify("تم حفظ الصورة بدل المشاركة", "warn");
            }}
            onDownload={async () => {
              const how = await saveJpg(viewing.blob, viewing.name);
              notify(how === "gallery" ? "حُفظت في معرض الجهاز (JPG)" : "تم تنزيل الصورة بصيغة JPG");
            }}
            onDelete={async () => {
              await gallery.remove(viewing.id);
              setViewing(null);
              notify("تم حذف الصورة", "warn");
            }}
          />
        )}

        {/* تراكب المعالجة */}
        {busy && (
          <div className="absolute inset-0 z-[60] grid place-items-center bg-ink-950/75 backdrop-blur-md">
            <div className="animate-pop text-center">
              <div className="relative mx-auto mb-4 h-16 w-16">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-glow/40 to-pink-glow/40 blur-md" />
                <span className="absolute inset-1 animate-spin-slow rounded-full border-[3px] border-white/15 border-t-sky-glow" />
                <ZapIcon
                  width={22}
                  height={22}
                  className="absolute inset-0 m-auto text-white"
                />
              </div>
              <p className="text-sm font-extrabold text-white">{busy}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/45">
                تقليل الجودة ثم الأبعاد حتى تحقيق الحجم المطلوب
              </p>
            </div>
          </div>
        )}

        {/* تنبيه */}
        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[70] flex justify-center px-6">
            <div
              className={cn(
                "flex animate-toast items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-extrabold shadow-2xl ring-1 backdrop-blur-xl",
                toast.tone === "ok"
                  ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30"
                  : "bg-amber-400/15 text-amber-200 ring-amber-300/30",
              )}
            >
              {toast.tone === "ok" ? (
                <CheckIcon width={15} height={15} strokeWidth={3} />
              ) : (
                <ZapIcon width={15} height={15} />
              )}
              {toast.msg}
            </div>
          </div>
        )}

        {/* شاشة الترحيب */}
        {intro && (
          <div className="absolute inset-0 z-[80] flex flex-col justify-end bg-ink-950/92 backdrop-blur-xl">
            <div className="relative animate-fade px-6 pb-8">
              <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-kashmiri/40 blur-[80px]" />
              <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[26px] bg-gradient-to-br from-sky-glow via-kashmiri-soft to-pink-glow shadow-[0_20px_60px_-20px_rgba(167,139,250,0.9)]">
                <CameraIcon width={38} height={38} className="text-ink-950" strokeWidth={2.2} />
              </div>
              <h2 className="text-center text-3xl font-black tracking-tight text-white">
                Elsayad <span className="text-aurora">Lite</span>
              </h2>
              <p className="mt-2 text-center text-[13px] font-semibold leading-relaxed text-white/55">
                كاميرا داخلية سريعة تضغط صورك تلقائيًا بصيغة JPG،
                <br /> تحفظها في المعرض وتشاركها بضغطة واحدة.
              </p>

              <div className="mt-6 space-y-2.5">
                {[
                  { Icon: ZapIcon, t: "٣ مستويات ضغط تكيفي", s: "Low أقل من 250 KB · Medium متوازن · High حتى 300 KB" },
                  { Icon: SparkleIcon, t: "جودة ذكية", s: "يقلّل الجودة أولًا ثم الأبعاد لأصغر ملف ممكن" },
                  { Icon: ShareIcon, t: "حفظ ومشاركة فورية", s: "JPG جاهز للواتساب والمعرض مباشرة" },
                ].map(({ Icon, t, s }) => (
                  <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/8">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-glow/20 to-pink-glow/20 text-sky-glow ring-1 ring-white/10">
                      <Icon width={19} height={19} />
                    </span>
                    <div>
                      <p className="text-[13px] font-extrabold text-white">{t}</p>
                      <p className="text-[11px] font-semibold text-white/50">{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("elsayad-lite:seen", "1");
                  setIntro(false);
                }}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-glow via-kashmiri-soft to-pink-glow py-4 text-[15px] font-black text-ink-950 shadow-[0_20px_50px_-20px_rgba(56,189,248,0.9)] active:scale-[0.98]"
              >
                ابدأ التصوير
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/8 py-3 text-[13px] font-bold text-white/80 ring-1 ring-white/12"
              >
                <ImageUpIcon width={17} height={17} /> أو اضغط صورة موجودة
              </button>
            </div>
          </div>
        )}

        <input
          ref={importRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 12);
            e.target.value = "";
            setTab("camera");
            if (!files.length) return;
            notify(`جارٍ ضغط ${files.length} صورة…`);
            for (const f of files) {
              await processCapture(f, "import");
            }
          }}
        />
      </div>
    </div>
  );
}
