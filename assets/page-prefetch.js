/**
 * 页面预加载优化脚本
 * 智能预加载导航链接,提升页面切换响应速度
 */

(function() {
    'use strict';

    // 已预加载的 URL 集合
    const prefetched = new Set();
    
    // 预加载限制：同时最多预加载的页面数
    const MAX_PREFETCH = 3;
    let prefetchCount = 0;

    /**
     * 预加载页面
     * @param {string} url - 要预加载的 URL
     */
    function prefetchPage(url) {
        if (prefetched.has(url) || prefetchCount >= MAX_PREFETCH) {
            return;
        }

        // 检查浏览器支持
        if (!('IntersectionObserver' in window)) {
            return;
        }

        // 检查网络状态 - 仅在较快的网络下预加载
        if ('connection' in navigator) {
            const conn = navigator.connection;
            if (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
                return;
            }
        }

        prefetched.add(url);
        prefetchCount++;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        
        link.onload = () => {
            prefetchCount--;
            console.log(`✅ 已预加载: ${url}`);
        };
        
        link.onerror = () => {
            prefetchCount--;
            prefetched.delete(url);
        };

        document.head.appendChild(link);
    }

    /**
     * 初始化页面预加载
     */
    function initPrefetch() {
        // 1. 鼠标悬停预加载
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            // 只预加载内部链接
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                prefetchPage(href);
            }
        }, { passive: true });

        // 2. 触摸设备：使用 Intersection Observer 预加载可见链接
        if ('ontouchstart' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const href = entry.target.getAttribute('href');
                        if (href && href.startsWith('/') && !href.startsWith('//')) {
                            // 延迟预加载，避免阻塞主线程
                            setTimeout(() => prefetchPage(href), 100);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // 观察所有导航链接
            document.querySelectorAll('a[href^="/"]').forEach(link => {
                observer.observe(link);
            });
        }

        // 3. 预加载高优先级页面（在空闲时）
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                const highPriorityPages = [
                    '/about.html',
                    '/blog',
                    '/guestbook.html'
                ];
                
                highPriorityPages.forEach((url, index) => {
                    setTimeout(() => prefetchPage(url), index * 500);
                });
            });
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPrefetch);
    } else {
        initPrefetch();
    }

    // 页面可见性变化时管理预加载
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面隐藏时停止预加载
            prefetchCount = MAX_PREFETCH;
        } else {
            // 页面恢复可见时重置计数
            prefetchCount = 0;
        }
    });

})();
