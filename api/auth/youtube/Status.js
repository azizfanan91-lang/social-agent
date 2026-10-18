const {
  parseCookies,
  decodeState,
  encrypt,
  exchangeCode,
  getChannel
} = require("../../lib/youtube");

function go(res, path) {
  res.statusCode = 302;
  res.setHeader("Location", path);
  res.end();
}

module.exports = async function handler(req, res) {
  const q = req.query || {};
  if (q.error) {
    return go(res, "/?youtube=denied");
  }

  const state = decodeState(q.state);
  const cookies = parseCookies(req);
  if (!state || !q.code || !cookies.yt_state || cookies.yt_state !== state.nonce) {
    return go(res, "/?youtube=invalid");
  }

  try {
    const tokens = await exchangeCode(q.code);
    const channel = await getChannel(tokens.access_token);
    const session = encrypt({
      userId: state.userId,
      channel: channel,
      refreshToken: tokens.refresh_token || null
    });
    const flags = "Path=/; HttpOnly; Secure; SameSite=Lax";
    res.setHeader("Set-Cookie", [
      "yt_session=" + encodeURIComponent(session) + "; " + flags + "; Max-Age=2592000",
      "yt_state=; " + flags + "; Max-Age=0"
    ]);
    return go(res, "/?youtube=connected");
  } catch (e) {
    return go(res, "/?youtube=error");
  }
};

