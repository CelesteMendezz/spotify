const CACHE_NAME = 'mi-cache-v1';
const API_CACHE_NAME = 'Spotify'; 
const API_URL = 'https://deezerdevs-deezer.p.rapidapi.com/search'; 


const urlsToCache = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./ws.js",
    "./manifest.json",
    "./img/cap1.png",
    "./img/cap2.png",
    "./img/icon1.png",
    "./img/icon2.png"
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalado');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache).catch((error) => {
                console.error('Error al agregar archivos al cache:', error);
                
                console.log('Archivos que no pudieron ser almacenados:', urlsToCache);
            });
        })
    );
});


self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});


self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse; 
            }

            return fetch(event.request).then(networkResponse => {
                // Clonar la respuesta ANTES de leerla
                let responseClone = networkResponse.clone();

                caches.open(API_CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });

                return networkResponse;
            });
        }).catch(() => caches.match('/404.html')) 
    );
});


// Sincronización de datos (si necesitas realizar tareas de fondo)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sincronizar-datos') {
        event.waitUntil(
            console.log('Service Worker: Sincronizando datos')
        );
    }
});
