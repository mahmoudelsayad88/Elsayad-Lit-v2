/**
 * Elsayad Lite — جسر الأنظمة الأصلية (Native bridge)
 *
 * داخل تطبيق الأندرويد (Capacitor) نستخدم الإضافات الرسمية:
 *  - @capacitor/filesystem : كتابة ملف JPG
 *  - @capacitor-community/media : إدخال الصورة في MediaStore => تظهر في "معرض" أندرويد
 *  - @capacitor/share : نافذة المشاركة الأصلية (واتساب، تيليجرام، بلوتوث…)
 *
 * وفي المتصفح نرجع تلقائيًا إلى التنزيل و Web Share API.
 */

type AnyFn = (...args: never[]) => unknown;

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const out = String(r.result);
      resolve(out.includes(",") ? out.slice(out.indexOf(",") + 1) : out);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function writeTemp(name: string, blob: Blob): Promise<string | null> {
  try {
    const fs = (await import("@capacitor/filesystem")) as unknown as {
      Filesystem: { writeFile: AnyFn };
      Directory: { Cache: unknown };
    };
    const data = await blobToBase64(blob);
    const res = (await fs.Filesystem.writeFile({
      path: name,
      data,
      directory: fs.Directory.Cache,
      recursive: true,
    } as never)) as { uri?: string };
    return res?.uri ?? null;
  } catch {
    return null;
  }
}

export type SaveResult = "gallery" | "cache" | "download";

/** حفظ الصورة: في معرض الجهاز (APK) أو التنزيل (المتصفح) */
export async function saveJpg(blob: Blob, filename: string): Promise<SaveResult> {
  if (isNativeApp()) {
    const uri = await writeTemp(filename, blob);
    if (uri) {
      try {
        const media = (await import("@capacitor-community/media")) as unknown as {
          Media: { savePhoto: AnyFn };
        };
        await media.Media.savePhoto({
          path: uri,
          album: "Elsayad Lite",
          fileName: filename,
        } as never);
        return "gallery";
      } catch {
        return "cache";
      }
    }
  }
  const { downloadBlob } = await import("./utils");
  downloadBlob(blob, filename);
  return "download";
}

export type ShareResult = "shared" | "saved" | "unsupported";

/** مشاركة الصورة عبر نافذة المشاركة الأصلية أو Web Share API */
export async function shareJpg(
  blob: Blob,
  filename: string,
  text = "صورة من Elsayad Lite",
): Promise<ShareResult> {
  if (isNativeApp()) {
    const uri = await writeTemp(filename, blob);
    if (uri) {
      try {
        const share = (await import("@capacitor/share")) as unknown as {
          Share: { share: AnyFn };
        };
        await share.Share.share({
          title: "Elsayad Lite",
          text,
          url: uri,
          files: [uri],
          dialogTitle: "مشاركة الصورة",
        } as never);
        return "shared";
      } catch (err) {
        const msg = String((err as { message?: string })?.message ?? "");
        if (/cancel|abort/i.test(msg)) return "saved";
      }
    }
    const how = await saveJpg(blob, filename);
    return how === "gallery" ? "saved" : "unsupported";
  }

  const { shareBlob } = await import("./utils");
  return shareBlob(blob, filename, text);
}
