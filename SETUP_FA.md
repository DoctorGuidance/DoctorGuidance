# 🚀 راهنمای پروفایل

## وضعیت فعلی

⚠️ اکانت گیت‌هابت پیام «locked due to a billing issue» میده و **GitHub Actions اجرا نمیشه**. به همین خاطر:

- کارت آمار (Lab Results) و نوار ECG سالانه (Contribution ECG) به‌صورت **استاتیک از دیتای واقعی پروفایلت** ساخته و کامیت شدن — به هیچ سرویس و Action ای وابسته نیستن و برای همه (از جمله ایران) لود می‌شن.
- workflowهای مار/metrics/گراف سه‌بعدی حذف شدن که ایمیل fail برات نیاد.

## فعال‌سازی

```bash
cd "D:\Ershad Zolfi\programming\coding with Gemini\DoctorGuidance"
git push origin main
```

همین. بعد از push پروفایلت کامله — هیچ قدم دیگه‌ای لازم نیست.

## رفع قفل اکانت (اختیاری ولی توصیه‌شده)

1. برو به `github.com/settings/billing` و ببین چه خطایی نشون میده.
2. از `support.github.com` تیکت بزن (برای flagهای تحریمی معمولاً با appeal حل میشه — گیت‌هاب از ۲۰۲۱ سرویس‌های رایگان رو برای ایران آزاد کرده).
3. بعد از رفع قفل بگو تا workflowهای خودکار (مار، metrics روزانه، گراف سه‌بعدی) رو برگردونم.

## به‌روزرسانی آمار

کارت‌های آمار استاتیک‌ان (اسنپ‌شات از امروز). هر وقت خواستی تازه شن، فقط بگو «آمار پروفایل رو رفرش کن» — از API عمومی می‌خونم و دوباره می‌سازم.

## شخصی‌سازی

- هدر / مانیتور vitals: `assets/header.svg` و `assets/vitals.svg`
- نقش‌های چرخشی: `assets/roles.svg`
- کارت فارسی (فونت وزیر، تبدیل‌شده به path): `assets/fa-about.svg`
- کارت آمار و ECG سالانه: `assets/stats.svg` و `assets/contrib.svg`
- پرتره‌ی متحرک Vignette Bloom: `assets/profile-vignette-bloom.webp`
- موتور و دموی Canvas2D: پوشه‌ی `ascii-editor/`
- پیش‌نمایش دقیق قبل از push: فایل `preview.html` رو توی مرورگر باز کن

## بازسازی پرتره‌ی متحرک

اگر عکس منبع `ascii-editor/demos/generated/profile-source.png` رو عوض کردی، خروجی جدید رو با این دستور بساز:

```bash
npm install
npm run render:profile
```

این اسکریپت بدون GitHub Actions اجرا می‌شه و فایل `assets/profile-vignette-bloom.webp` رو دوباره تولید می‌کنه.
