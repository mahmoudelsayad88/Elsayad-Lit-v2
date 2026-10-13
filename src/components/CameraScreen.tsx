import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { LEVELS, type LevelId } from "@/lib/compress";
import type { AppSettings } from "@/lib/settings";
import {
  BoltIcon,
  CameraIcon,
  FlipIcon,
  GridIcon,
  ImageUpIcon,
  ShutterIcon,
  TimerIcon,
  ZapIcon,
} from "@/components/Icons";
import { LevelChips } from "@/components/ui";

type Facing = "environment" | "user";
type Status = "idle" | "starting" | "ready" | "denied" | "unsupported";

const ASPECT_LABEL: Record<AppSettings["aspect"], string> = {
  "4:3": "4:3",
  "16:9": "16:9",
  full: "كامل",
};

function playShutterClick() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.13);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.18);
    setTimeout(() => ctx.close(), 400);
  } catch {
    /* ignore */
  }
}

interface Props {
  settings: AppSettings;
  onLevelChange: (l: LevelId) => void;
  onPatch: (patch: Partial<AppSettings>) => void;
  onCapture: (raw: Blob, source: "camera" | "front" | "import") => void;
  busy: boolean;
  lastThumb?: string;
  onOpenLast: () => void;
}

export default function CameraScreen({
  settings,
  onLevelChange,
  onPatch,
  onCapture,
  busy,
  lastThumb,
  onOpenLast,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [status, setStatus] = useState<Status>("idle");
  const [torch, setTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");
  const [portrait, setPortrait] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorch(false);
    setTorchOn(false);
    setZoom(null);
    setZoomRange(null);
  }, []);

  const start = useCallback(
    async (f: Facing) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("starting");
      setError("");
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: f },
            width: { ideal: 2560 },
            height: { ideal: 1440 },
          },
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            /* autoplay guard */
          }
        }
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
          torch?: boolean;
          zoom?: { min: number; max: number; step?: number };
        };
        setTorch(Boolean(caps.torch));
        if (caps.zoom && caps.zoom.max > caps.zoom.min) {
          setZoomRange({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step ?? 0.1 });
          setZoom((track.getSettings?.().zoom as number) ?? caps.zoom.min);
        }
        setStatus("ready");
      } catch (e) {
        const err = e as DOMException;
        if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
          setError("لم يتم العثور على كاميرا متاحة على هذا الجهاز.");
        } else if (err?.name === "NotReadableError") {
          setError("الكاميرا مستخدمة من تطبيق آخر. أغلقها وحاول مرة أخرى.");
        } else {
          setError("تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم أعد المحاولة.");
        }
        setStatus("denied");
      }
    },
    [stopStream],
  );

  useEffect(() => {
    void start(facing);
    return () => stopStream();
  }, [facing, start, stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      setTorchOn(false);
    }
  };

  const applyZoom = async (value: number) => {
    setZoom(value);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value }] } as unknown as MediaTrackConstraints);
    } catch {
      /* ignore */
    }
  };

  const grabFrame = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.resolve(null);

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;

    if (settings.aspect !== "full") {
      const landscape = vw >= vh;
      const ratio = settings.aspect === "4:3" ? (landscape ? 4 / 3 : 3 / 4) : landscape ? 16 / 9 : 9 / 16;
      if (sw / sh > ratio) {
        sw = Math.round(sh * ratio);
        sx = Math.round((vw - sw) / 2);
      } else {
        sh = Math.round(sw / ratio);
        sy = Math.round((vh - sh) / 2);
      }
    }

    const maxDim = 4096;
    const scale = Math.min(1, maxDim / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return Promise.resolve(null);
    ctx.imageSmoothingQuality = "high";
    const mirror = facing === "user" && settings.mirrorFront;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.96));
  }, [facing, settings.aspect, settings.mirrorFront]);

  const fire = useCallback(async () => {
    if (busy) return;
    setFlash(true);
    if (settings.sound) playShutterClick();
    if (settings.haptic) navigator.vibrate?.(28);
    setTimeout(() => setFlash(false), 420);
    const blob = await grabFrame();
    if (!blob) return;
    onCapture(blob, facing === "user" ? "front" : "camera");
  }, [busy, facing, grabFrame, onCapture, settings.haptic, settings.sound]);

  const shoot = useCallback(() => {
    if (busy || countdown > 0 || status !== "ready") return;
    const wait = settings.timer;
    if (!wait) {
      void fire();
      return;
    }
    cancelled.current = false;
    let left = wait;
    setCountdown(left);
    const tick = () => {
      if (cancelled.current) {
        setCountdown(0);
        return;
      }
      left -= 1;
      if (left <= 0) {
        setCountdown(0);
        void fire();
      } else {
        setCountdown(left);
        setTimeout(tick, 1000);
      }
    };
    setTimeout(tick, 1000);
  }, [busy, countdown, fire, settings.timer, status]);

  const cycleAspect = () => {
    const order: AppSettings["aspect"][] = ["4:3", "16:9", "full"];
    const idx = order.indexOf(settings.aspect);
    onPatch({ aspect: order[(idx + 1) % order.length] });
  };

  /** نسبة المعاينة = نسبة القص الفعلي للصورة المحفوظة (ما تراه هو ما تحصل عليه) */
  const previewRatio = (() => {
    if (settings.aspect === "full") return portrait ? 9 / 16 : 16 / 9;
    if (settings.aspect === "16:9") return portrait ? 9 / 16 : 16 / 9;
    return portrait ? 3 / 4 : 4 / 3;
  })();

  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-3">
      <LevelChips value={settings.level} onChange={onLevelChange} />

      <div className="relative flex-1 overflow-hidden rounded-[28px] bg-black ring-1 ring-white/12 shadow-[0_30px_70px_-40px_rgba(56,189,248,0.7)]">
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="relative max-h-full w-full overflow-hidden bg-ink-900"
            style={{ aspectRatio: String(previewRatio) }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setPortrait(v.videoHeight >= v.videoWidth);
              }}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-500",
                status === "ready" ? "opacity-100" : "opacity-0",
                facing === "user" && settings.mirrorFront && "-scale-x-100",
              )}
            />

            {/* شبكة الثلث */}
            {settings.grid && status === "ready" && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
              </div>
            )}

            {/* زخرفة أعلى */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(56,189,248,0.16),transparent_60%)]" />
          </div>
        </div>

        {/* أزرار عائمة */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <div className="flex gap-2">
            <RoundBtn active={torchOn} disabled={!torch} onClick={toggleTorch} title="الفلاش">
              <BoltIcon width={18} height={18} />
            </RoundBtn>
            <RoundBtn
              active={settings.timer > 0}
              onClick={() => onPatch({ timer: settings.timer ? 0 : 3 })}
              title="المؤقّت"
            >
              <TimerIcon width={18} height={18} />
              {settings.timer > 0 && (
                <span className="absolute -bottom-1 rounded-full bg-sky-glow px-1 text-[9px] font-bold text-ink-950">
                  {settings.timer}ث
                </span>
              )}
            </RoundBtn>
          </div>
          <div className="flex gap-2">
            <RoundBtn active={settings.grid} onClick={() => onPatch({ grid: !settings.grid })} title="الشبكة">
              <GridIcon width={18} height={18} />
            </RoundBtn>
            <RoundBtn onClick={cycleAspect} title="الأبعاد">
              <span className="text-[10px] font-black">{ASPECT_LABEL[settings.aspect]}</span>
            </RoundBtn>
          </div>
        </div>

        {/* مؤقّت التنازلي */}
        {countdown > 0 && (
          <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[2px]">
            <button
              onClick={() => {
                cancelled.current = true;
                setCountdown(0);
              }}
              className="text-[92px] font-black leading-none text-aurora animate-pop"
            >
              {countdown}
            </button>
            <span className="absolute bottom-6 text-xs font-semibold text-white/70">اضغط لإلغاء المؤقّت</span>
          </div>
        )}

        {/* وميض الغالق */}
        {flash && <div className="pointer-events-none absolute inset-0 bg-white shutter-flash" />}

        {/* حالات */}
        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="animate-fade">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sky-glow/25 to-pink-glow/25 ring-1 ring-white/15">
                {status === "starting" ? (
                  <span className="h-7 w-7 animate-spin-slow rounded-full border-2 border-white/25 border-t-sky-glow" />
                ) : (
                  <CameraIcon width={28} height={28} className="text-sky-glow" />
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {status === "starting" && "جارٍ تشغيل الكاميرا…"}
                {status === "idle" && "الكاميرا الداخلية جاهزة للبدء"}
                {status === "denied" && "لا يمكن الوصول إلى الكاميرا"}
                {status === "unsupported" && "المتصفح لا يدعم الكاميرا الداخلية"}
              </p>
              {error && <p className="mx-auto mt-2 max-w-[260px] text-xs leading-relaxed text-white/55">{error}</p>}
              {status === "denied" && (
                <button
                  onClick={() => void start(facing)}
                  className="mt-4 rounded-full bg-gradient-to-r from-sky-glow to-kashmiri-soft px-5 py-2 text-xs font-bold text-ink-950"
                >
                  إعادة المحاولة
                </button>
              )}
              {(status === "denied" || status === "unsupported") && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 block w-full rounded-full border border-white/15 px-5 py-2 text-xs font-bold text-white/80"
                >
                  استخدم كاميرا الجهاز بدلًا من ذلك
                </button>
              )}
            </div>
          </div>
        )}

        {/* تكبير */}
        {zoomRange && status === "ready" && (
          <div className="absolute inset-x-10 bottom-3">
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoom ?? zoomRange.min}
              onChange={(e) => void applyZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-sky-glow"
              style={{
                background: `linear-gradient(to left, rgba(56,189,248,0.95) ${
                  Math.round(
                    Math.min(100, Math.max(0, (((zoom ?? 0) - zoomRange.min) / (zoomRange.max - zoomRange.min || 1)) * 100)),
                  )
                }%, rgba(255,255,255,0.22) 0%)`,
              }}
            />
          </div>
        )}
      </div>

      {/* شريط التحكم */}
      <div className="flex items-center justify-between gap-4 px-2 pb-1">
        <button
          onClick={onOpenLast}
          className={cn(
            "h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-white/20 transition-all",
            lastThumb ? "opacity-100" : "opacity-40",
          )}
        >
          {lastThumb ? (
            <img src={lastThumb} alt="آخر صورة" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-white/5 text-white/40">
              <ImageUpIcon width={20} height={20} />
            </span>
          )}
        </button>

        <button
          onClick={shoot}
          disabled={status !== "ready" || busy}
          className="group relative grid h-[74px] w-[74px] place-items-center rounded-full disabled:opacity-50"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-glow via-kashmiri-soft to-pink-glow opacity-90 blur-[1px]" />
          <span className="absolute inset-[3px] rounded-full bg-ink-950/85 backdrop-blur" />
          <span className="absolute inset-0 rounded-full border border-sky-glow/60 animate-ring" />
          {busy ? (
            <span className="relative h-7 w-7 animate-spin-slow rounded-full border-2 border-white/25 border-t-pink-glow" />
          ) : (
            <ShutterIcon width={34} height={34} className="relative text-white" strokeWidth={1.6} />
          )}
        </button>

        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          disabled={status !== "ready"}
          className="grid h-14 w-14 place-items-center rounded-2xl bg-white/8 text-sky-glow ring-1 ring-white/15 transition-colors active:scale-95 disabled:opacity-40"
          title="تبديل الكاميرا"
        >
          <FlipIcon width={22} height={22} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pb-1 text-[10px] font-semibold text-white/40">
        <ZapIcon width={12} height={12} className="text-sky-glow" />
        الضغط التكيفي: {LEVELS[settings.level].name} · {LEVELS[settings.level].note}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f, "camera");
          e.target.value = "";
        }}
      />
      <input
        ref={importRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach((f) => onCapture(f, "import"));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function RoundBtn({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full ring-1 backdrop-blur-md transition-all active:scale-90",
        active
          ? "bg-gradient-to-br from-sky-glow/90 to-pink-glow/80 text-ink-950 ring-white/40"
          : "bg-black/35 text-white/85 ring-white/15",
        disabled && "opacity-35",
      )}
    >
      {children}
    </button>
  );
}
