module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "المفتاح ناقص فـ Vercel" });

  const { idea, platform } = req.body || {};
  if (!idea) return res.status(400).json({ error: "اكتب الفكرة" });

  const prompt = "اكتب منشوراً جذاباً لمنصة " + (platform || "social media") +
    " بالدارجة المغربية حول: " + String(idea).slice(0, 500) +
    ". اجعله قصيراً مع إيموجي وهاشتاغات قليلة. أعطني المنشور فقط بدون شرح.";

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: (d.error && d.error.message) || "خطأ من Gemini" });
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ text: text.trim() });
  } catch (e) {
    res.status(500).json({ error: "تعذر الاتصال" });
  }
};
