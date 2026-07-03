# 🚀 راهنمای نصب پروفایل جدید

همه فایل‌های این پوشه (`github-profile/`) باید داخل ریپوی **DoctorGuidance/DoctorGuidance** قرار بگیرن.

## قدم ۱ — کپی فایل‌ها به ریپوی پروفایل

```bash
# کلون ریپوی پروفایل (اگه لوکال نداری)
git clone https://github.com/DoctorGuidance/DoctorGuidance.git
cd DoctorGuidance

# کپی محتوای این پوشه (README.md، پوشه assets، پوشه .github)
# بعد:
git add -A
git commit -m "✨ Complete profile redesign — medical-tech fusion"
git push origin main
```

⚠️ دقت کن پوشه `assets/` و `.github/workflows/snake.yml` هم حتماً push بشن — SVGهای انیمیت از همون ریپو لود میشن.

## قدم ۲ — فعال‌سازی Snake (یه بار)

1. برو به ریپوی `DoctorGuidance/DoctorGuidance` → تب **Actions** → اگه پرسید، **Enable workflows** رو بزن.
2. **Settings → Actions → General → Workflow permissions** → گزینه **Read and write permissions** رو انتخاب و Save کن.
3. تب **Actions** → workflow «Generate Snake Animation» → دکمه **Run workflow**.
4. بعد از ۱-۲ دقیقه، برنچ `output` ساخته میشه و مار توی پروفایل ظاهر میشه. از این به بعد هر شب خودکار آپدیت میشه.

## قدم ۳ — چک نهایی

برو به `github.com/DoctorGuidance` — باید ببینی:

- هدر انیمیت با خط ECG متحرک و اسمت با گرادیان رنگی
- تایپینگ انیمیشن نقش‌هات
- مانیتور علائم حیاتی (Live Vitals) با ۴ موج متحرک
- جداکننده‌های ECG بین بخش‌ها
- استک تکنولوژی با آیکون‌های skillicons
- استتس‌ها با پس‌زمینه شفاف (توی dark و light هر دو خوب دیده میشه)
- مار خورنده‌ی contribution
- بخش فارسی RTL

## نکته‌ها

- اگه خواستی متن هدر یا مقادیر مانیتور رو عوض کنی، فایل‌های `assets/header.svg` و `assets/vitals.svg` رو ادیت کن — همه چیز SVG دست‌سازه و قابل شخصی‌سازیه.
- آیکون‌های skillicons رو می‌تونی از [skillicons.dev](https://skillicons.dev) کم و زیاد کنی (پارامتر `i=` توی README).
- کارت‌های stats چون `bg_color=00000000` (شفاف) دارن، توی هر دو تم گیت‌هاب خوب دیده میشن.
