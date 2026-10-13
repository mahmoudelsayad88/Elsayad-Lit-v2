import type { LevelId } from "@/lib/compress";

export interface AppSettings {
  level: LevelId;
  autoSave: boolean;
  autoDownload: boolean;
  autoShare: boolean;
  mirrorFront: boolean;
  grid: boolean;
  timer: number;
  aspect: "4:3" | "16:9" | "full";
  sound: boolean;
  haptic: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  level: "medium",
  autoSave: true,
  autoDownload: true,
  autoShare: false,
  mirrorFront: true,
  grid: true,
  timer: 0,
  aspect: "4:3",
  sound: true,
  haptic: true,
};

export const SETTINGS_KEY = "elsayad-lite:settings:v1";
