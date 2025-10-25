/**
 * Service Worker - 静态资源缓存
 * 提升页面加载速度和离线体验
 */

const CACHE_VERSION = 'liueggy-v2';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/about.html',
    '/guestbook.html',
    '/assets/style.css?v=11',
    '/assets/app.js?v=3',
    '/assets/page-prefetch.js'
];

// 安装事件 - 预缓存关键资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('📦 预缓存关键资源');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_VERSION)
                        .map(name => {
                            console.log('🗑️ 删除旧缓存:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 只缓存同源请求
    if (url.origin !== location.origin) {
        return;
    }

    // 跳过 API 请求
    if (url.pathname.startsWith('/blog/api') || url.pathname.startsWith('/api')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // 返回缓存，同时在后台更新
                    event.waitUntil(
                        fetch(request)
                            .then(response => {
                                if (response.ok) {
                                    return caches.open(CACHE_VERSION)
                                        .then(cache => cache.put(request, response));
                                }
                            })
                            .catch(() => {})
                    );
                    return cachedResponse;
                }

                // 没有缓存，发起网络请求
                return fetch(request)
                    .then(response => {
                        // 只缓存成功的 GET 请求
                        if (request.method === 'GET' && response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_VERSION)
                                .then(cache => cache.put(request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // 离线时返回自定义离线页面
                        if (request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// 消息事件 - 手动清除缓存
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then(cacheNames => Promise.all(
                    cacheNames.map(name => caches.delete(name))
                ))
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
        );
    }
});
