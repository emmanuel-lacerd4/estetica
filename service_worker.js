const CACHE_NAME = 'shalon-adonai-v1'
const ASSETS = [
    '/',
    '/index.html',
    '/bootstrap/css/bootstrap.min.css',
    '/bootstrap/js/bootstrap.min.js',
    '/assets/css/style.css',
    '/pages/agendamento.html',
    '/assets/js/agendamento.js', 
    '/assets/js/jquery.min.js', 
    '/assets/js/popper.min.js',  
    '/assets/js/attyear.js',
    '/assets/js/pwa.js',
    '/service/manifest.json'
]

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    )
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        })
    )
})