const MODEL = "gemini-3.8-flash";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "المفتاح ناقص فـ Vercel" });
  }

  const body = req.body || {};
  const idea = body.idea;
  const platform = body.platform || "social media";
  if (!idea) {
    return res.status(400).json({ error: "اكتب الفكرة" });
  }

  const prompt =
    "اكتب منشوراً جذاباً لمنصة " + platform +
    " بالدارجة المغربية حول: " + String(idea).slice(0, 500) +
    ". اجعله قصيراً مع إيموجي وهاشتاغات قليلة. أعطني المنشور فقط بدون شرح.";

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL + ":generateContent";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const d = await r.json();
