const crypto = require("crypto");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(header.split(";").filter(Boolean).map((item) => {
    const index = item.indexOf("=");
    return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())];
  }));
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearCookie(res, name) {
  setCookie(res, name, "", { maxAge: 0 });
}

function sign(value) {
  return crypto.createHmac("sha256", requiredEnv("YOUTUBE_SESSION_SECRET")).update(value).digest("base64url");
}

function encodeState(state) {
  const payload = base64url(JSON.stringify(state));
  return `${payload}.${sign(payload)}`;
}

function decodeState(value) {
  try {
    if (!value) return null;
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!state.expiresAt || Date.now() > state.expiresAt) return null;
    return state;
  } catch (_) {
    return null;
  }
}

function encrypt(value) {
  const key = crypto.createHash("sha256").update(requiredEnv("YOUTUBE_SESSION_SECRET")).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value) {
  try {
    const [ivPart, tagPart, dataPart] = value.split(".");
    const key = crypto.createHash("sha256").update(requiredEnv("YOUTUBE_SESSION_SECRET")).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch (_) {
    return null;
  }
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: requiredEnv("YOUTUBE_REDIRECT_URI"),
    grant_type: "authorization_code"
  });
  const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token exchange failed");
  return data;
}

async function getChannel(accessToken) {
  const response = await fetch(YOUTUBE_CHANNELS_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "YouTube API request failed");
  const item = data.items?.[0];
  if (!item) throw new Error("لم يتم العثور على قناة YouTube في هذا الحساب");
  return {
    id: item.id,
    title: item.snippet?.title || "YouTube channel",
    thumbnail: item.snippet?.thumbnails?.default?.url || null,
    subscribers: item.statistics?.subscriberCount || null,
    connectedAt: new Date().toISOString()
  };
}

function oauthUrl(state) {
  const params = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: requiredEnv("YOUTUBE_REDIRECT_URI"),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    state
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

module.exports = { parseCookies, setCookie, clearCookie, encodeState, decodeState, encrypt, decrypt, exchangeCode, getChannel, oauthUrl };
