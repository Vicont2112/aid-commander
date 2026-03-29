const CACHE_NAME = 'aid-commander-v3';

// Список файлов, которые нужны для работы оффлайн
const ASSETS_TO_CACHE = [
  './',
  './aid_commander_v3.html',
  './manifest.json',
  './icon.svg'
];

// При установке воркера кэшируем нужные ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Заставляем воркер активироваться сразу
  self.skipWaiting();
});

// Очистка старых кэшей при обновлении
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Стратегия Stale-While-Revalidate: отдаем из кэша, а в фоне обновляем кэш из сети
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Обновляем кэш новым ответом из сети
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Не удалось скачать из сети (оффлайн) - ничего не делаем, отдали из кэша
      });

      // Возвращаем из кэша сразу, если есть, а сетевой запрос пойдет в фоне.
      // Если в кэше нет (первый запуск), ждем сетевой запрос.
      return cachedResponse || fetchPromise;
    })
  );
});
