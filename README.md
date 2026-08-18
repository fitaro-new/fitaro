# FITARO — النسخة المصححة

## لو عايز تشوف التصميم فقط على جهاز الشغل
افتح `index.html` مباشرة.
الصور والـCSS والمنتجات ستظهر بشكل صحيح.

## مهم
زر "اقترح لي" و"جرّب البدلة" وFITARO AI تحتاج تشغيل الموقع على Vercel لأن ملفات `/api` تحتاج Serverless Backend.
فتح `index.html` مباشرة لا يشغل API.

## Vercel
ارفع محتويات هذا المجلد إلى GitHub ثم اربطه بـ Vercel.
أضف:
- OPENAI_API_KEY
- OPENAI_MODEL = gpt-4o-mini
- FAL_KEY

ثم Redeploy.

## الملفات
index.html
css/style.css
js/app.js
data/products.json
data/products.js
public/suits/*
api/*

### إصلاح الصور
عند فتح index.html مباشرة من File Explorer تستخدم الصور من `public/suits/`، وعند Vercel تستخدم `/suits/`.
