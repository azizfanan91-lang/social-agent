function xmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim() : "";
}

function attrValue(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
  return match ? match[1] : "";
}

function channelIdFromInput(value) {
  const input = String(value || "").trim();
  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    const index = parts.indexOf("channel");
    if (index >= 0 && /^UC[a-zA-Z0-9_-]{20,}$/.test(parts[index + 1] || "")) return parts[index + 1];
  } catch (_) {}
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const channelId = channelIdFromInput(req.body?.channel || req.body?.channelId);
  if (!channelId) {
    return res.status(400).json({ error: "أدخل رابط قناة من نوع /channel/UC... أو Channel ID صحيح" });
  }

  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
    const xml = await response.text();
    if (!response.ok || !xml.includes("<feed")) {
      return res.status(404).json({ error: "لم يتم العثور على قناة عامة بهذا المعرف" });
    }

    const authorBlock = xml.match(/<author>([\s\S]*?)<\/author>/)?.[1] || "";
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 10).map((match) => {
      const item = match[1];
      return {
        id: xmlValue(item, "yt:videoId"),
        title: xmlValue(item, "title"),
        published: xmlValue(item, "published"),
        updated: xmlValue(item, "updated"),
        url: `https://www.youtube.com/watch?v=${encodeURIComponent(xmlValue(item, "yt:videoId"))}`,
        thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(xmlValue(item, "yt:videoId"))}/mqdefault.jpg`
      };
    });

    return res.status(200).json({
      channel: {
        id: channelId,
        title: xmlValue(authorBlock, "name"),
        url: `https://www.youtube.com/channel/${channelId}`,
        feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      },
      videos: entries
    });
  } catch (_) {
    return res.status(502).json({ error: "تعذر الاتصال بـ YouTube" });
  }
};
