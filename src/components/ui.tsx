import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { LEVELS, LEVEL_ORDER, type LevelId } from "@/lib/compress";
import { CheckIcon } from "@/components/Icons";

export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-sky-glow/30 blur-[90px] animate-aurora" />
      <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-kashmiri/35 blur-[100px] animate-aurora-slow" />
      <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-pink-glow/25 blur-[100px] animate-aurora" />
    </div>
  );
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass rounded-3xl p-4 shadow-[0_18px_50px_-30px_rgba(56,189,248,0.55)]",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-right transition-colors hover:bg-white/5"
    >
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-sky-glow">
          {icon}
        </span>
      )}
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-white/95">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-white/50">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300",
          checked
            ? "border-transparent bg-gradient-to-r from-sky-glow via-kashmiri-soft to-pink-glow shadow-[0_0_18px_-4px_rgba(167,139,250,0.9)]"
            : "border-white/15 bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300",
            checked ? "right-[22px]" : "right-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function LevelChips({
  value,
  onChange,
  compact,
}: {
  value: LevelId;
  onChange: (l: LevelId) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-2 rounded-2xl bg-black/35 p-1.5 ring-1 ring-white/10 backdrop-blur-xl">
      {LEVEL_ORDER.map((id) => {
        const l = LEVELS[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "relative flex-1 rounded-xl px-2 text-center transition-all duration-300",
              compact ? "py-1.5" : "py-2",
              active
                ? cn("bg-gradient-to-br text-white ring-1", l.bar, l.ring, l.glow)
                : "text-white/55 hover:text-white/85",
            )}
          >
            <span className="block text-[13px] font-bold tracking-wide">{l.name}</span>
            {!compact && (
              <span className="mt-0.5 block text-[10px] leading-tight opacity-80">{l.note}</span>
            )}
            {active && (
              <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function LevelCard({
  id,
  active,
  onSelect,
}: {
  id: LevelId;
  active: boolean;
  onSelect: () => void;
}) {
  const l = LEVELS[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border p-4 text-right transition-all duration-300",
        active
          ? cn("border-white/25 bg-gradient-to-br from-white/12 to-white/4 ring-1", l.ring, l.glow)
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border text-xs font-black",
            l.chip,
          )}
        >
          {l.name.slice(0, 1)}
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="text-base font-extrabold text-white">
              {l.name} <span className="text-white/45">·</span>{" "}
              <span className="text-sm font-semibold text-white/80">{l.nameAr}</span>
            </span>
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-sky-glow">{l.note}</span>
        </span>
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full border transition-all",
            active
              ? "border-transparent bg-gradient-to-br from-sky-glow to-pink-glow text-white"
              : "border-white/20 text-transparent",
          )}
        >
          <CheckIcon width={15} height={15} strokeWidth={2.6} />
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-white/60">{l.desc}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className={cn("rounded-full border px-2 py-1", l.chip)}>
          الحد {Math.round(l.targetBytes / 1024)} KB
        </span>
        <span className="rounded-full border border-white/12 bg-white/5 px-2 py-1 text-white/60">
          الجودة {Math.round(l.qMin * 100)}–{Math.round(l.qMax * 100)}%
        </span>
        <span className="rounded-full border border-white/12 bg-white/5 px-2 py-1 text-white/60">
          حتى {l.startDim}px
        </span>
      </div>
    </button>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-3 py-2.5 text-center ring-1 ring-white/8">
      <div className={cn("text-sm font-extrabold", accent ?? "text-white")}>{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/45">{label}</div>
    </div>
  );
}
