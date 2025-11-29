--- START OF FILE sw.js ---

// 版本號更新為 v9 (優化快取策略與穩定性)
const CACHE_NAME = 'travel-note-v9';

// 核心檔案：必須下載成功才能安裝 Service Worker
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 外部依賴：如果下載失敗，不應阻止 App 運作
const OPTIONAL_ASSETS = [
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                // 嘗試快取外部依賴，失敗只會發出警告，不會中斷安裝
                cache.addAll(OPTIONAL_ASSETS).catch(err => console.warn('[SW] Optional assets failed:', err));
                // 核心檔案必須成功
                return cache.addAll(CORE_ASSETS);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // 匯率 API 依然走網路優先
    if (event.request.url.includes('api.exchangerate-api.com') || 
        event.request.url.includes('open.er-api.com')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});