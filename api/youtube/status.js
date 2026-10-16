const { parseCookies, decrypt } = require("../../lib/youtube");

module.exports = (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const connection = decrypt(parseCookies(req).youtube_connection);
  if (!connection?.channel) return res.status(200).json({ connected: false });
  return res.status(200).json({ connected: true, channel: connection.channel });
};
