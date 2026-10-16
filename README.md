# social-agent

## ربط YouTube

التطبيق يدعم الآن ربط قناة YouTube عبر Google OAuth للقراءة فقط.

### متغيرات البيئة المطلوبة في Vercel

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=https://t-rho.vercel.app/api/auth/youtube/callback
YOUTUBE_SESSION_SECRET=ضع_قيمة_عشوائية_طويلة_جدا
```

أنشئ OAuth Client من Google Cloud Console، واختر **Web application**، ثم أضف رابط إعادة التوجيه نفسه حرفيًا إلى **Authorized redirect URIs**. فعّل **YouTube Data API v3** في المشروع.

بعد إضافة المتغيرات وإعادة النشر:

1. افتح التطبيق.
2. اضغط **ربط حساب YouTube**.
3. اختر حساب Google المرتبط بالقناة.
4. وافق على صلاحية القراءة المطلوبة.
5. سيعود التطبيق ويعرض اسم القناة وحالتها كمربوطة.

لا تضع `GOOGLE_CLIENT_SECRET` أو `YOUTUBE_SESSION_SECRET` في ملفات الواجهة أو GitHub. الجلسة المشفّرة تحفظ حالة الربط ورموز OAuth داخل cookie آمنة؛ لا تُستخدم الرموز إلا لخدمات YouTube الخاصة بهذا التطبيق.
