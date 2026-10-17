const { parseCookies, decrypt, clearCookie } = require("../../lib/youtube");

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
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const user = token ? await getUser(token) : null;
  if (!user || !user.id) {
    return res.status(401).json({ error: "Login required" });
  }

  if (req.method === "POST") {
    clearCookie(res, "yt_session");
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET or POST only" });
  }

  try {
    const cookies = parseCookies(req);
    const session = cookies.yt_session ? decrypt(cookies.yt_session) : null;
    if (!session || session.userId !== user.id) {
      return res.status(200).json({ connected: false });
    }
    return res.status(200).json({ connected: true, channel: session.channel });
  } catch (e) {
    return res.status(200).json({ connected: false });
  }
};
