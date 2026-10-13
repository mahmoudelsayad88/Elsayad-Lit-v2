#!/usr/bin/env node
/**
 * Elsayad Lite — تهيئة مشروع الأندرويد الذي يولّده Capacitor داخل GitHub Actions.
 *
 * يقوم بـ:
 *  1) إضافة أذونات الكاميرا والاهتزاز والتخزين إلى AndroidManifest.xml
 *  2) تفعيل تسريع العتاد وحجم الذاكرة الأكبر للـ WebView
 *  3) تثبيت أيقونة التطبيق (public/icons/app-icon.png) في كل كثافات mipmap
 *  4) ضبط رقم الإصدار من package.json
 *
 * السكربت آمن لإعادة التشغيل (idempotent).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const AND = path.join(root, "android");
const MAIN = path.join(AND, "app", "src", "main");

if (!fs.existsSync(AND)) {
  console.error("✖ لم يتم العثور على مجلد android/ — شغّل `npx cap add android` أولًا.");
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * 1) الأذونات
 * ------------------------------------------------------------------ */
const manifestPath = path.join(MAIN, "AndroidManifest.xml");
let manifest = fs.readFileSync(manifestPath, "utf8");

const INJECTS = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera.flash" android:required="false" />',
  '<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
];

let added = 0;
for (const tag of INJECTS) {
  if (!manifest.includes(tag.split("android:name=")[1]?.split(" ")[0] ?? tag)) {
    manifest = manifest.replace(/<application/, `    ${tag}\n    <application`);
    added++;
  }
}

/* سمات <application> */
manifest = manifest.replace(/<application\b([^>]*)>/, (_m, attrs) => {
  let a = attrs;
  const extras = {
    "android:hardwareAccelerated": "true",
    "android:largeHeap": "true",
    "android:requestLegacyExternalStorage": "true",
    "android:hardwareAccelerated_": "true",
  };
  for (const [k, v] of Object.entries(extras)) {
    const key = k.replace(/_$/, "");
    if (!a.includes(key)) a += ` ${key}="${v}"`;
  }
  return `<application${a}>`;
});

fs.writeFileSync(manifestPath, manifest, "utf8");
console.log(`✔ AndroidManifest.xml — أُضيف ${added} سطر أذونات`);

/* ------------------------------------------------------------------ *
 * 2) اسم التطبيق
 * ------------------------------------------------------------------ */
const stringsPath = path.join(MAIN, "res", "values", "strings.xml");
if (fs.existsSync(stringsPath)) {
  let strings = fs.readFileSync(stringsPath, "utf8");
  strings = strings.replace(/<string name="app_name">.*?<\/string>/, "<string name=\"app_name\">Elsayad Lite</string>");
  fs.writeFileSync(stringsPath, strings, "utf8");
  console.log("✔ strings.xml — الاسم: Elsayad Lite");
}

/* ------------------------------------------------------------------ *
 * 3) الأيقونة
 * ------------------------------------------------------------------ */
const iconSrc = path.join(root, "public", "icons", "app-icon.png");
if (fs.existsSync(iconSrc)) {
  const png = fs.readFileSync(iconSrc);
  const res = path.join(MAIN, "res");
  const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
  for (const d of densities) {
    const dir = path.join(res, `mipmap-${d}`);
    if (!fs.existsSync(dir)) continue;
    // إزالة الملفات القديمة (webp/xml) لتفادي تعارض الموارد
    for (const f of fs.readdirSync(dir)) {
      if (/^ic_launcher/.test(f)) fs.rmSync(path.join(dir, f), { force: true });
    }
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), png);
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), png);
  }
  // أيقونة تكيّفية v26 → نستخدم PNG مباشرة
  const anydpi = path.join(res, "mipmap-anydpi-v26");
  if (fs.existsSync(anydpi)) fs.rmSync(anydpi, { recursive: true, force: true });
  console.log("✔ أيقونة التطبيق مثبتة في كل الكثافات");
} else {
  console.warn("⚠ لم يتم العثور على public/icons/app-icon.png — سيتم استخدام الأيقونة الافتراضية");
}

/* ------------------------------------------------------------------ *
 * 4) الإصدار
 * ------------------------------------------------------------------ */
const pkgPath = path.join(root, "package.json");
const gradlePath = path.join(AND, "app", "build.gradle");
if (fs.existsSync(pkgPath) && fs.existsSync(gradlePath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const version = String(pkg.version ?? "1.0.0");
  const parts = version.split(".").map((n) => parseInt(n, 10) || 0);
  const code = parts[0] * 10000 + (parts[1] ?? 0) * 100 + (parts[2] ?? 0);
  let gradle = fs.readFileSync(gradlePath, "utf8");
  gradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${code}`)
    .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, gradle, "utf8");
  console.log(`✔ build.gradle — versionName ${version} (versionCode ${code})`);
}

console.log("\n✅ تمت تهيئة مشروع الأندرويد لـ Elsayad Lite\n");
