const cacheName = 'StopAdware-v1.0.0';

const addResourcesToCache = async (resources) => {
	const cache = await caches.open(cacheName);
	await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/StopAdwarePWA/",
      "/StopAdwarePWA/index.html",
      "/StopAdwarePWA/favicon.ico",
      "/StopAdwarePWA/assets/js/script.js",
      "/StopAdwarePWA/assets/css/style.css",
      "/StopAdwarePWA/assets/img/icon-32.png",
      "/StopAdwarePWA/assets/img/icon-64.png",
      "/StopAdwarePWA/assets/img/icon-128.png",
      "/StopAdwarePWA/assets/img/icon-180.png",
      "/StopAdwarePWA/assets/img/icon-192.png",
      "/StopAdwarePWA/assets/img/icon-196.png",
      "/StopAdwarePWA/assets/img/icon-256.png",
      "/StopAdwarePWA/assets/img/icon-512.png",
    ])
  );
});

self.addEventListener('fetch', (e) => {
	e.respondWith((async () => {
		const r = await caches.match(e.request);
		console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
		if (r) return r;
		const response = await fetch(e.request);
		const cache = await caches.open(cacheName);
		console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
		cache.put(e.request, response.clone());
		return response;
	})());
});

