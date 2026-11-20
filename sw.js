// Garde le site en mémoire dans le navigateur.
// - Police, bibliothèques, affiches, icône : servies tout de suite depuis la mémoire, et rafraîchies en arrière-plan.
// - Pages, scripts et seance.txt : toujours la version en ligne d'abord (pour ne jamais montrer un test périmé),
//   la mémoire ne sert que si internet ne répond pas.
const CACHE = 'points-de-vue-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const frais = fetch(e.request).then(n => { if (n.ok) { const copie = n.clone(); caches.open(CACHE).then(c => c.put(u.pathname, copie)); } return n; });
  if (/\/(polices|libs|affiches)\/|icone\.png$/.test(u.pathname)) e.respondWith(caches.match(u.pathname).then(r => { if (r) { frais.catch(() => { }); return r; } return frais; }));
  else e.respondWith(frais.catch(() => caches.match(u.pathname)));
});
