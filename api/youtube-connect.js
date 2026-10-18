const crypto = require("crypto");
const { encodeState, oauthUrl, setCookie } = require("../lib/youtube");

const SUPABASE_URL = "https://rvwzwpennszchbvhboct.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_W0Goga6-pKGR6ew_UhfIaA_qYY0S2ow";

async function getUser(token) {
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const user = token ? await getUser(token) : null;
  if (!user || !user.id) {
    return res.status(401).json({ error: "Login required" });
  }
  try {
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = encodeState({
      userId: user.id,
      nonce: nonce,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    setCookie(res, "yt_state", nonce, { maxAge: 600 });
    return res.status(200).json({ url: oauthUrl(state) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
