const {
  parseCookies,
  setCookie,
  clearCookie,
  decodeState,
  encrypt,
  exchangeCode,
  getChannel
} = require("../../../lib/youtube");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { code, state, error } = req.query || {};
  if (error) return res.redirect(302, `/?youtube_error=${encodeURIComponent(error)}`);

  try {
    const cookies = parseCookies(req);
    const savedState = decodeState(cookies.youtube_oauth_state);
    if (!savedState || !state || savedState.csrf !== decodeState(state)?.csrf) {
      return res.status(400).send("OAuth state غير صالح أو منتهي الصلاحية");
    }
    if (!code) return res.status(400).send("لم يتم استلام رمز Google");

    const tokens = await exchangeCode(code);
    const channel = await getChannel(tokens.access_token);
    setCookie(res, "youtube_connection", encrypt({
      channel,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000
    }), { maxAge: 60 * 60 * 24 * 30 });
    clearCookie(res, "youtube_oauth_state");
    return res.redirect(302, "/?youtube=connected");
  } catch (error) {
    return res.redirect(302, `/?youtube_error=${encodeURIComponent(error.message)}`);
  }
};
