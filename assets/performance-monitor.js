/**
 * 页面性能监控
 * 监控关键性能指标并输出报告
 */

(function() {
    'use strict';

    // 等待页面完全加载
    window.addEventListener('load', () => {
        // 延迟执行，确保所有资源加载完成
        setTimeout(reportPerformance, 1000);
    });

    function reportPerformance() {
        if (!window.performance || !window.performance.timing) {
            console.log('⚠️ 浏览器不支持 Performance API');
            return;
        }

        const timing = performance.timing;
        const navigation = performance.navigation;

        // 计算关键性能指标
        const metrics = {
            // DNS 查询时间
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            // TCP 连接时间
            tcp: timing.connectEnd - timing.connectStart,
            // 请求响应时间
            request: timing.responseEnd - timing.requestStart,
            // DOM 解析时间
            domParse: timing.domInteractive - timing.domLoading,
            // 资源加载时间
            resourceLoad: timing.loadEventStart - timing.domContentLoadedEventEnd,
            // 首次渲染时间
            firstPaint: timing.responseEnd - timing.fetchStart,
            // DOMContentLoaded 时间
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            // 完全加载时间
            loadComplete: timing.loadEventEnd - timing.navigationStart
        };

        // 输出性能报告
        console.log('%c⚡ 页面性能报告', 'font-size: 16px; font-weight: bold; color: #4a9eff');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log(`🔍 DNS 查询: ${metrics.dns}ms`);
        console.log(`🔌 TCP 连接: ${metrics.tcp}ms`);
        console.log(`📡 请求响应: ${metrics.request}ms`);
        console.log(`📄 DOM 解析: ${metrics.domParse}ms`);
        console.log(`📦 资源加载: ${metrics.resourceLoad}ms`);
        console.log(`🎨 首次渲染: ${metrics.firstPaint}ms`);
        console.log(`✅ DOM 就绪: ${metrics.domReady}ms`);
        console.log(`🎉 完全加载: ${metrics.loadComplete}ms`);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 导航类型
        const navType = ['正常导航', '页面刷新', '前进/后退', '预留'][navigation.type] || '未知';
        console.log(`📍 导航类型: ${navType}`);

        // 获取资源加载详情
        if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            console.log(`📊 加载资源数: ${resources.length}`);
            
            // 统计资源类型
            const resourceTypes = {};
            resources.forEach(resource => {
                const type = resource.initiatorType || 'other';
                resourceTypes[type] = (resourceTypes[type] || 0) + 1;
            });
            
            console.log('📋 资源类型统计:');
            Object.entries(resourceTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });

            // 找出最慢的资源
            const slowestResources = resources
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5);
            
            console.log('🐌 加载最慢的 5 个资源:');
            slowestResources.forEach((resource, index) => {
                const name = resource.name.split('/').pop() || resource.name;
                console.log(`   ${index + 1}. ${name}: ${Math.round(resource.duration)}ms`);
            });
        }

        // 性能评分
        const score = getPerformanceScore(metrics);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`${getScoreEmoji(score)} 性能评分: ${score}/100`);
        console.log(getPerformanceAdvice(score));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 计算性能评分 (0-100)
    function getPerformanceScore(metrics) {
        let score = 100;
        
        // 完全加载时间影响 (40 分)
        if (metrics.loadComplete > 3000) score -= 40;
        else if (metrics.loadComplete > 2000) score -= 30;
        else if (metrics.loadComplete > 1000) score -= 20;
        else if (metrics.loadComplete > 500) score -= 10;
        
        // DOM 就绪时间影响 (30 分)
        if (metrics.domReady > 2000) score -= 30;
        else if (metrics.domReady > 1500) score -= 20;
        else if (metrics.domReady > 1000) score -= 10;
        
        // 首次渲染时间影响 (30 分)
        if (metrics.firstPaint > 1500) score -= 30;
        else if (metrics.firstPaint > 1000) score -= 20;
        else if (metrics.firstPaint > 500) score -= 10;
        
        return Math.max(0, score);
    }

    // 获取评分表情
    function getScoreEmoji(score) {
        if (score >= 90) return '🚀';
        if (score >= 70) return '✅';
        if (score >= 50) return '⚠️';
        return '❌';
    }

    // 获取性能建议
    function getPerformanceAdvice(score) {
        if (score >= 90) {
            return '优秀！页面加载速度非常快。';
        } else if (score >= 70) {
            return '良好！页面性能不错，可以考虑进一步优化。';
        } else if (score >= 50) {
            return '一般。建议优化资源加载和减少阻塞。';
        } else {
            return '需要改进！建议检查资源大小、启用缓存和 CDN。';
        }
    }

    // 监控长任务 (可选，支持的浏览器)
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn(`⏱️ 检测到长任务: ${Math.round(entry.duration)}ms`);
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // 浏览器不支持长任务监控
        }
    }

})();
