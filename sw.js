// 앱을 고쳐서 다시 올릴 때는 VERSION 숫자를 올려 주세요. 그래야 폰이 새 파일을 받아요.
const VERSION = "v2";
const CACHE = "weather-map-" + VERSION;
const SHELL = ["./", "index.html", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("weather-map-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);

  // 날씨 데이터는 항상 최신으로: 캐시하지 않고 그대로 인터넷에서 받아요
  if(url.hostname.endsWith("open-meteo.com")) return;

  // 앱 파일과 지도 윤곽: 캐시를 먼저 보여주고, 뒤에서 새로 받아 갱신해요
  const cacheable = url.origin === location.origin || url.hostname === "cdn.jsdelivr.net";
  if(!cacheable) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch:true });
      const net = fetch(req).then(res => { if(res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
