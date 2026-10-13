<div dir="rtl">

# 📸 Elsayad Lite

كاميرا داخلية سريعة بضغط **تكيفي** ذكي، تحفظ الصور بصيغة **JPG** في المعرض وتشاركها بضغطة واحدة.
مبني بـ React + Vite + Tailwind، ويُغلَّف كتطبيق **Android APK** تلقائيًا عبر **GitHub Actions**.

| المستوى | الوصف | الحد |
|---|---|---|
| **Low** | أصغر حجم ممكن — للواتساب والرسائل | أقل من **250 KB** |
| **Medium** | توازن بين الجودة والحجم | متوازن |
| **High** | أعلى جودة ممكنة مع أكبر أبعاد | بحد أقصى **300 KB** |

> محرك الضغط يعمل بالبحث الثنائي على جودة JPEG أولًا، ثم يقلّل الأبعاد تدريجيًا **حتى يتحقق الحجم المطلوب**.

---

## 🎯 المميزات

- 📷 كاميرا داخلية أمامية/خلفية + فلاش + تكبير + مؤقّت (3/10 ثانية) + شبكة ثلث.
- 🎨 أبعاد قابلة للاختيار: 4:3 · 16:9 · كامل — والمعاينة مطابقة تمامًا للصورة المحفوظة.
- ⚡ 3 مستويات ضغط تكيفي، ولوحة إحصائيات (الحجم قبل/بعد، الجودة، الزمن، عدد المحاولات).
- 🔄 إعادة ضغط نفس الصورة بمستوى آخر من **الأصل** بدون إعادة التصوير.
- 🖼️ معرض داخلي (IndexedDB) بإحصائيات المساحة المُوفَّرة.
- 💾 حفظ تلقائي في **معرض الجهاز** (ألبوم *Elsayad Lite*) داخل APK، وإنشاء مجلد التنزيلات في المتصفح.
- 🔗 مشاركة أصلية عبر نافذة المشاركة (واتساب، تيليجرام…) أو Web Share API.
- 🌗 واجهة عربية RTL بألوان سماوي · زهري · أزرق · كاشميري.

---

## 🚀 رفع التطبيق على GitHub والحصول على APK

### 1) أنشئ المستودع وارفع الملفات

```bash
git init
git add .
git commit -m "Elsayad Lite v1.0.0"
git branch -M main
git remote add origin https://github.com/<اسم-حسابك>/elsayad-lite.git
git push -u origin main
```

> أو من الموقع: **New repository** ← ثم **Add file ▸ Upload files** واسحب كل ملفات المشروع.

### 2) شغّل عملية بناء APK

1. افتح المستودع ← تبويب **Actions**.
2. إن طُلب منك، اضغط **I understand my workflows, go ahead and enable them**.
3. اختر **Build Android APK** ← **Run workflow** ← **Run workflow**.
4. بعد انتهاء المهمة (٢–٥ دقائق) افتحها وانزل إلى **Artifacts**.
5. نزّل **`elsayad-lite-apk`** ← ستجد داخله:
   - `Elsayad-Lite-main.apk` — نسخة موقّعة جاهزة للتثبيت والنشر.
   - `Elsayad-Lite-debug.apk` — نسخة تجريبية.

ثم انقل الملف إلى هاتفك وثبّته (اسمح بـ *تثبيت من مصادر غير معروفة*).

### 3) (اختياري) أنشئ إصدارًا رسميًا مع Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

سيُنشئ الـ workflow صفحة **Releases** ويُرفق بها ملف الـ APK تلقائيًا.

---

## 🔐 توقيع الـ APK (موصى به للمتجر)

بدون خطوة التوقيع، يستخدم الـ workflow مفتاحًا مؤقتًا (يكفي للتجربة على هاتفك فقط).
لتوقيع ثابت، أنشئ مفتاحًا وارفعه كـ Secret:

```bash
# 1) إنشاء المفتاح
keytool -genkeypair -v -keystore elsayad.jks -alias elsayad \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass كلمة-السر -keypass كلمة-السر \
  -dname "CN=Elsayad Lite, O=Elsayad, C=EG"

# 2) ترميزه بصيغة Base64 (على ويندوز: certutil -encode elsayad.jks ks.txt)
base64 -w0 elsayad.jks > ks.b64
```

ثم في **Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret** أضف:

| الاسم | القيمة |
|---|---|
| `ANDROID_KEYSTORE_B64` | محتوى ملف `ks.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | كلمة سر الـ keystore |
| `ANDROID_KEY_ALIAS` | `elsayad` |
| `ANDROID_KEY_PASSWORD` | كلمة سر المفتاح |

> ⚠️ **احتفظ بنسخة من `elsayad.jks`** — بدونها لا يمكنك تحديث التطبيق بنفس التوقيع.

---

## 🌐 نسخة الويب (PWA) على GitHub Pages

الـ workflow **Deploy Web App** ينشر التطبيق تلقائيًا على:

```
https://<اسم-حسابك>.github.io/elsayad-lite/
```

فعّلها من **Settings ▸ Pages ▸ Source: GitHub Actions**. ومن المتصفح على الهاتف اختر
*«إضافة إلى الشاشة الرئيسية»* ليعمل بملء الشاشة كتطبيق.

---

## 🗂️ بنية الملفات المهمة

```
.github/workflows/
  android.yml        ← يبني ويوقّع APK (Debug + Release)
  web.yml            ← ينشر نسخة الويب على Pages
scripts/
  patch-android.mjs  ← أذونات الكاميرا + الأيقونة + رقم الإصدار
capacitor.config.json← إعدادات غلاف الأندرويد
public/icons/app-icon.png  ← أيقونة التطبيق
src/lib/compress.ts ← محرك الضغط التكيفي
src/lib/native.ts   ← حفظ في معرض الجهاز + مشاركة أصلية
```

> مجلد `android/` لا يُرفع للمستودع (موجود في `.gitignore`) — يُولَّد داخل CI بواسطة
> `npx cap add android`، مما يضمن أن إصدارات Gradle/AGP متوافقة دائمًا.

---

## 🛠️ البناء محليًا (اختياري — Android Studio)

```bash
npm install
npm run build
npx cap add android
node scripts/patch-android.mjs
npx cap sync android
```

ثم افتح مجلد `android/` في Android Studio واضغط **Run**.

---

## ⚙️ كيف يعمل الضغط التكيفي؟

```
الصورة الأصلية
   │
   ├─ 1) تقليص الأبعاد بخطوات نصفية (جودة تصغير عالية)
   ├─ 2) بحث ثنائي على جودة JPEG (0.34 ← 0.97 حسب المستوى)
   ├─ 3) إن لم يتحقق الحد ⟵ تقليل الأبعاد 0.82× وإعادة المحاولة
   └─ النتيجة: أصغر ملف ممكن دون تجاوز الحد المستهدف
```

كل شيء يتم **على الجهاز** داخل المتصفح/التطبيق — لا يوجد أي رفع أو خوادم.

---

## 📄 الترخيص

MIT — استخدمه وعدّله ونشره بحرّية.

</div>
