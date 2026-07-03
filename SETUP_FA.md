# 🚀 راهنمای راه‌اندازی پروفایل

## قدم ۱ — push

```bash
cd "D:\Ershad Zolfi\programming\coding with Gemini\DoctorGuidance"
git push origin main
```

## قدم ۲ — فعال‌سازی Actions (یه بار)

1. **Settings → Actions → General → Workflow permissions** → گزینه **Read and write permissions** → Save.
2. تب **Actions** → هر سه workflow رو یه بار دستی **Run workflow** بزن:
   - `Generate Metrics` → فایل `assets/metrics.svg` رو می‌سازه (جایگزین کارت‌های vercel که برای IP ایران بلاک بودن)
   - `Generate 3D Contribution Graph` → گراف سه‌بعدی night-rainbow
   - `Generate Snake Animation` → برنچ `output` و مار 🐍
3. از این به بعد هر شب خودکار آپدیت می‌شن.

## چرا دیگه هیچی broke نمیشه؟

کارت‌های قبلی (stats/streak/languages) از vercel.app لود می‌شدن که برای کاربرای ایران بلاکه. الان همه‌چیز **داخل خود ریپو** تولید و کامیت میشه — فقط این‌ها خارجی موندن که رو Cloudflare هستن و مشکلی ندارن: skillicons، shields.io و شمارنده بازدید.

## شخصی‌سازی

- متن هدر / مقادیر مانیتور: `assets/header.svg` و `assets/vitals.svg`
- نقش‌های چرخشی: `assets/roles.svg`
- کارت فارسی (فونت وزیر): `assets/fa-about.svg` — متن‌ها به path تبدیل شدن؛ برای تغییر متن بگو تا دوباره تولیدش کنم
- آیکون‌های تک‌استک: پارامتر `i=` توی README از [skillicons.dev](https://skillicons.dev)
