// --- START OF FILE sw.js ---

// 修改這裡：更新版本號為 v8，確保瀏覽器重新下載優化後的 index.html
const CACHE_NAME = 'travel-note-v8';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    // 即使前端改為懶加載，這裡仍須保留，讓 SW 在背景預先下載，確保離線時也能匯出
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// 安裝 Service Worker 並快取靜態資源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 啟用並清除舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // 清除舊版本的快取
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // 強制讓新版 Service Worker 立即接管頁面
    return self.clients.claim();
});

// 攔截請求：優先使用快取，無網路時也能顯示 App
self.addEventListener('fetch', (event) => {
    // 排除 API 請求 (匯率 API 需要即時連線)
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