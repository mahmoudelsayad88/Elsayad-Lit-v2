import { useEffect, useState } from "react";
import { LEVEL_ORDER, type LevelId } from "@/lib/compress";
import type { AppSettings } from "@/lib/settings";
import { formatBytes } from "@/lib/utils";
import {
  BoltIcon,
  CheckIcon,
  DownloadIcon,
  FlipIcon,
  GridIcon,
  ImageUpIcon,
  InfoIcon,
  PhoneIcon,
  ShareIcon,
  ShieldIcon,
  TimerIcon,
  ZapIcon,
} from "@/components/Icons";
import { Card, LevelCard, Toggle } from "@/components/ui";
import { cn } from "@/utils/cn";

interface Props {
  settings: AppSettings;
  onPatch: (p: Partial<AppSettings>) => void;
  totals: { bytes: number; originalBytes: number };
  photoCount: number;
  onClear: () => void;
}

const LEVELS_AR: Record<AppSettings["aspect"], string> = {
  "4:3": "٤:٣ كلاسيكي",
  "16:9": "١٦:٩ عريض",
  full: "كامل الشاشة",
};

export default function SettingsScreen({ settings, onPatch, totals, photoCount, onClear }: Props) {
  const [usage, setUsage] = useState<{ usage: number; quota: number }>({ usage: 0, quota: 0 });
  const saved = Math.max(0, totals.originalBytes - totals.bytes);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => {});
  }, [photoCount]);

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-6">
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-kashmiri/30 to-sky-glow/25 text-kashmiri-soft ring-1 ring-white/12">
            <ZapIcon width={22} height={22} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold text-white">مستويات الضغط</p>
            <p className="text-[11px] font-semibold text-white/50">
              المحرك يقلّل الجودة ثم الأبعاد حتى يتحقق الحد
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2.5">
          {LEVEL_ORDER.map((id) => (
            <LevelCard key={id} id={id} active={settings.level === id} onSelect={() => onPatch({ level: id as LevelId })} />
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="mb-1 text-[15px] font-extrabold text-white">الحفظ والمشاركة</p>
        <p className="mb-2 text-[11px] font-semibold text-white/45">
          الصورة تُحفظ تلقائيًا في المعرض بصيغة JPG فور الالتقاط
        </p>
        <Toggle
          checked={settings.autoSave}
          onChange={(v) => onPatch({ autoSave: v })}
          label="حفظ تلقائي في المعرض"
          hint="يُخزَّن الملف المضغوط في معرض التطبيق مباشرة بعد التصوير."
          icon={<CheckIcon width={17} height={17} />}
        />
        <Toggle
          checked={settings.autoDownload}
          onChange={(v) => onPatch({ autoDownload: v })}
          label="تنزيل نسخة JPG للجهاز"
          hint="يُضاف الملف إلى مجلد التنزيلات ليلتقطه معرض أندرويد."
          icon={<DownloadIcon width={17} height={17} />}
        />
        <Toggle
          checked={settings.autoShare}
          onChange={(v) => onPatch({ autoShare: v })}
          label="فتح نافذة المشاركة تلقائيًا"
          hint="مشاركة الصورة عبر واتساب أو غيره مباشرة بعد الحفظ."
          icon={<ShareIcon width={17} height={17} />}
        />
      </Card>

      <Card className="mb-4">
        <p className="mb-1 text-[15px] font-extrabold text-white">الكاميرا</p>
        <Toggle
          checked={settings.mirrorFront}
          onChange={(v) => onPatch({ mirrorFront: v })}
          label="قلب الكاميرا الأمامية"
          hint="حفظ الصورة كما تراها في المعاينة (غير معكوسة)."
          icon={<FlipIcon width={17} height={17} />}
        />
        <Toggle
          checked={settings.grid}
          onChange={(v) => onPatch({ grid: v })}
          label="شبكة الثلث"
          hint="خطوط مساعدة لتحسين التكوين."
          icon={<GridIcon width={17} height={17} />}
        />
        <Toggle
          checked={settings.sound}
          onChange={(v) => onPatch({ sound: v })}
          label="صوت الغالق"
          hint="نقرة قصيرة عند الالتقاط."
          icon={<BoltIcon width={17} height={17} />}
        />
        <Toggle
          checked={settings.haptic}
          onChange={(v) => onPatch({ haptic: v })}
          label="الاهتزاز"
          hint="ردّ فعل لمسي عند التصوير."
          icon={<PhoneIcon width={17} height={17} />}
        />

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.05] px-3 py-3 ring-1 ring-white/8">
          <span className="flex items-center gap-2 text-[13px] font-bold text-white/85">
            <TimerIcon width={16} height={16} className="text-sky-glow" /> المؤقّت
          </span>
          <div className="flex gap-1.5">
            {[0, 3, 10].map((t) => (
              <button
                key={t}
                onClick={() => onPatch({ timer: t })}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[12px] font-extrabold transition-all",
                  settings.timer === t
                    ? "bg-gradient-to-r from-sky-glow to-kashmiri-soft text-ink-950"
                    : "bg-white/8 text-white/60",
                )}
              >
                {t === 0 ? "بدون" : `${t}ث`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 rounded-2xl bg-white/[0.05] px-3 py-3 ring-1 ring-white/8">
          <p className="mb-2 text-[13px] font-bold text-white/85">أبعاد الصورة</p>
          <div className="flex gap-1.5">
            {(["4:3", "16:9", "full"] as AppSettings["aspect"][]).map((a) => (
              <button
                key={a}
                onClick={() => onPatch({ aspect: a })}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2 text-[11px] font-extrabold transition-all",
                  settings.aspect === a
                    ? "bg-gradient-to-r from-kashmiri-soft to-pink-glow text-ink-950"
                    : "bg-white/8 text-white/60",
                )}
              >
                {LEVELS_AR[a]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-[15px] font-extrabold text-white">التخزين</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="الصور" value={String(photoCount)} />
          <MiniStat label="حجم المعرض" value={formatBytes(totals.bytes)} />
          <MiniStat label="المُوفَّر" value={formatBytes(saved)} />
        </div>
        {usage.quota > 0 && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-glow to-pink-glow"
                style={{ width: `${Math.max(2, Math.min(100, (usage.usage / usage.quota) * 100))}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-[10px] font-bold text-white/45">
              {formatBytes(usage.usage)} من {formatBytes(usage.quota)} المتاح
            </p>
          </>
        )}
        <button
          onClick={onClear}
          disabled={photoCount === 0}
          className="mt-3 w-full rounded-2xl bg-rose-500/15 py-3 text-[13px] font-extrabold text-rose-300 ring-1 ring-rose-400/25 disabled:opacity-40"
        >
          حذف كل الصور من المعرض
        </button>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <ShieldIcon width={20} height={20} className="text-emerald-300" />
          <p className="text-[15px] font-extrabold text-white">Elsayad Lite · v1.0</p>
        </div>
        <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-white/60">
          <li className="flex gap-2">
            <span className="text-sky-glow">•</span> كاميرا داخلية أمامية وخلفية مع فلاش وتكبير ومؤقّت.
          </li>
          <li className="flex gap-2">
            <span className="text-kashmiri-soft">•</span> ضغط تكيفي بصيغة JPG: Low &lt; 250 KB · Medium متوازن · High بأعلى
            جودة بحد 300 KB.
          </li>
          <li className="flex gap-2">
            <span className="text-pink-glow">•</span> حفظ تلقائي في المعرض + مشاركة فورية بضغطة واحدة.
          </li>
          <li className="flex gap-2">
            <span className="text-white/40">•</span> كل الصور تبقى على جهازك، بدون أي خوادم أو رفع.
          </li>
        </ul>
        <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-white/[0.05] p-3 text-[11px] leading-relaxed text-white/45 ring-1 ring-white/8">
          <InfoIcon width={14} height={14} className="mt-0.5 shrink-0 text-sky-glow" />
          نصيحة: أضف التطبيق إلى الشاشة الرئيسية من قائمة المتصفح ليعمل بملء الشاشة كتطبيق أندرويد.
          <ImageUpIcon width={0} height={0} />
        </p>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-2 py-2.5 ring-1 ring-white/8">
      <div className="text-[13px] font-extrabold text-white">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold text-white/45">{label}</div>
    </div>
  );
}
