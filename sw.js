// Service Worker: lưu các file của web vào máy để dùng khi không có mạng.
// Mở app luôn dùng bản đã lưu (mở nhanh, không phải chờ mạng), đồng thời tải bản mới ở nền.
// → Sau khi upload bản mới lên GitHub: mở app lần 1 sẽ tải bản mới về, mở lần 2 mới thấy thay đổi.
// Ảnh thẻ bài không nằm ở đây (lưu trong IndexedDB của app).
const CACHE = 'picards-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Có bản đã lưu: trả về ngay, rồi tải bản mới ở nền để lần mở sau dùng.
// Chưa có bản đã lưu: tải từ mạng (mất mạng thì dùng index.html đã lưu).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    });
    if (hit) {
      e.waitUntil(net.catch(() => {}));
      return hit;
    }
    return net.catch(() => c.match('./index.html'));
  }));
});
