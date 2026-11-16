/* تعاهدوا: يخلي الموقع يفتح حتى لو الإنترنت ضعيف أو مقطوع */
const V = 't3ahdo-v1';
const CORE = ['./', 'index.html', 'post.jpg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // بيانات Firebase نفسها تتعامل مع الانقطاع بروحها
  if (/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/identity/.test(u.hostname + u.pathname)) return;

  // الصفحة: جيب الجديد من النت، وإذا ما في نت افتح المحفوظ
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res;
    }).catch(() => caches.match('index.html').then(m => m || caches.match('./'))));
    return;
  }

  // الملفات والخطوط ومكتبات Firebase: من المحفوظ، وتتحدّث بالخلفية
  if (u.origin === location.origin || u.hostname === 'www.gstatic.com' || /fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
