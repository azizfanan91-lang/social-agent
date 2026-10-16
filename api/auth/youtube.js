const { encodeState, oauthUrl } = require("../../lib/youtube");

module.exports = (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const state = encodeState({ csrf: require("crypto").randomBytes(24).toString("hex"), expiresAt: Date.now() + 10 * 60 * 1000 });
    res.setHeader("Set-Cookie", `youtube_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    return res.redirect(302, oauthUrl(state));
  } catch (error) {
    return res.status(500).json({ error: "إعدادات YouTube غير مكتملة", detail: error.message });
  }
};
