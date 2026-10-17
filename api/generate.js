const MODEL = "gemini-3.8-flash";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing in Vercel" });
  }

  const body = req.body || {};
  const idea = body.idea;
  const platform = body.platform || "social media";
  if (!idea) {
    return res.status(400).json({ error: "idea is required" });
  }

  const prompt =
    "Write an engaging short post for " + platform +
    " in Moroccan Darija (Arabic script) about: " + String(idea).slice(0, 500) +
    ". Use a few emojis and a few hashtags. Return only the post, no explanation.";

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
    if (!r.ok) {
      const msg = d.error && d.error.message ? d.error.message : "Gemini error";
      return res.status(500).json({ error: msg });
    }

    let text = "";
    if (d.candidates && d.candidates[0] && d.candidates[0].content) {
      const parts = d.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) text = parts[0].text;
    }
    return res.status(200).json({ text: text.trim() });
  } catch (e) {
    return res.status(500).json({ error: "Connection failed" });
  }
};
