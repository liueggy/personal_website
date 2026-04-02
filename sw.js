// Intentionally left minimal.
// The site no longer uses a Service Worker because cached redirected responses
// conflict with Vercel clean URL routing and deployment protection.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
