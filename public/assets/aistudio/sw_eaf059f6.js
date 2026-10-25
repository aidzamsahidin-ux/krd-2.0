// sw.js - Diperlukan untuk PWA Installability
const CACHE_NAME = 'circulox-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Strategi rangkaian biasa untuk PWA ringkas
});


