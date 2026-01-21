const CACHE_NAME = "verb-trainer-v1";
const FILES = [
  "index.html",
  "style.css",
  "script.js",
  "verbi_coniugati.json",
  "manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});