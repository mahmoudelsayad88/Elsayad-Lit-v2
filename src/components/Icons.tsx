import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 24,
  height: 24,
  ...p,
});

export const CameraIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.95l.5-.85A2 2 0 0 1 10.6 3h2.8a2 2 0 0 1 1.7.95l.5.85A2 2 0 0 0 17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
    <circle cx="12" cy="13" r="3.6" />
  </svg>
);

export const GalleryIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <circle cx="8.6" cy="8.8" r="1.7" />
    <path d="M3.6 17.2 8.3 12.6a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 0 2.8 0l1.2-1.1a2 2 0 0 1 2.8.05L21 15" />
  </svg>
);

export const SlidersIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 21v-7M5 10V3M12 21v-10M12 7V3M19 21v-4M19 13V3" />
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="9" r="2" />
    <circle cx="19" cy="15" r="2" />
  </svg>
);

export const FlipIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4a8 8 0 0 1 7.4 5M12 20a8 8 0 0 1-7.4-5" />
    <path d="M19.5 4.5v4.6h-4.6M4.5 19.5v-4.6h4.6" />
  </svg>
);

export const BoltIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13.5 2 5 13h5l-.8 9L18 10h-5.2z" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);

export const TimerIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 10v3.5l2.4 1.6M9 2h6" />
  </svg>
);

export const ShutterIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 13v5.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V13" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V4.8A1.8 1.8 0 0 1 11.3 3h1.4a1.8 1.8 0 0 1 1.8 1.8V7" />
    <path d="M6 7l.9 12.2A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.8L18 7M10.5 11v6M13.5 11v6" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </svg>
);

export const SparkleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.7 4.6L18.5 9.3l-4.8 1.7L12 15.6l-1.7-4.6L5.5 9.3l4.8-1.7z" />
    <path d="M18 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
);

export const ImageUpIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path d="M12 15.5V9M9.2 11.4 12 8.6l2.8 2.8" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8h.01" />
  </svg>
);

export const ChevronIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s7-3.2 7-9V5.8L12 3 5 5.8V12c0 5.8 7 9 7 9z" />
    <path d="M9 12.2 11.2 14.5 15.2 10" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
    <path d="M10.5 5.2h3" />
  </svg>
);

export const ZapIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 17.5 9 6.5M9 6.5h11l-4.5 5.5H20L9 17.5z" />
  </svg>
);
