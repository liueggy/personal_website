/**
 * 页面动画增强模块
 * 包含滚动视差、元素渐入、打字机效果等
 */

(function() {
    'use strict';

    // 1. 滚动渐入动画
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // 观察技能卡片、博客卡片
        document.querySelectorAll('.flip-card, .blog-card, .section-header').forEach(el => {
            el.classList.add('fade-in-element');
            observer.observe(el);
        });
    };

    // 2. 打字机效果（用于标题）
    const typeWriter = (element, text, speed = 100) => {
        let i = 0;
        element.textContent = '';
        element.style.opacity = '1';
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        type();
    };

    // 3. 数字滚动动画
    const animateNumber = (element, target, duration = 2000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    };

    // 4. 鼠标跟随光效
    const createCursorGlow = () => {
        if (window.innerWidth < 768) return; // 移动端不显示
        
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.style.cssText = `
            position: fixed;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(74, 158, 255, 0.15) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(glow);

        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            glow.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            glow.style.opacity = '0';
        });

        // 平滑跟随
        const animate = () => {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;
            glow.style.left = glowX - 200 + 'px';
            glow.style.top = glowY - 200 + 'px';
            requestAnimationFrame(animate);
        };
        animate();
    };

    // 5. 页面滚动进度条
    const createScrollProgress = () => {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--primary-hover));
            width: 0%;
            z-index: 10000;
            transition: width 0.1s;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            progressBar.style.width = scrolled + '%';
        });
    };

    // 6. 返回顶部按钮
    const createBackToTop = () => {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `;
        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            cursor: pointer;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        btn.setAttribute('aria-label', '返回顶部');
        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            } else {
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(20px)';
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-5px) scale(1.1)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0) scale(1)';
        });
    };

    // 7. 技能卡片统计数字动画
    const animateStats = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    animateNumber(entry.target, target);
                    entry.target.classList.add('counted');
                }
            });
        });

        document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
    };

    // 8. 时间显示增强 - 添加脉动效果
    const enhanceTimeDisplay = () => {
        const timeSegments = document.querySelectorAll('.time-segment');
        let lastSecond = -1;

        setInterval(() => {
            const now = new Date();
            const second = now.getSeconds();
            
            if (second !== lastSecond) {
                timeSegments.forEach((segment, index) => {
                    setTimeout(() => {
                        segment.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            segment.style.transform = 'scale(1)';
                        }, 100);
                    }, index * 50);
                });
                lastSecond = second;
            }
        }, 100);

        // 添加过渡效果
        timeSegments.forEach(segment => {
            segment.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    };

    // 9. Hero区域粒子背景
    const createParticles = () => {
        const hero = document.querySelector('.hero-section');
        if (!hero) return;

        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.3;
        `;
        hero.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;

        const particles = [];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(74, 158, 255, 0.5)';
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', () => {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        });
    };

    // 添加CSS动画
    const addAnimationStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .fade-in-element {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }

            .fade-in-element.animate-in {
                opacity: 1;
                transform: translateY(0);
            }

            .flip-card.fade-in-element:nth-child(1) { transition-delay: 0.1s; }
            .flip-card.fade-in-element:nth-child(2) { transition-delay: 0.2s; }
            .flip-card.fade-in-element:nth-child(3) { transition-delay: 0.3s; }
            .flip-card.fade-in-element:nth-child(4) { transition-delay: 0.4s; }

            .back-to-top:hover {
                background: var(--primary-hover);
            }

            @media (max-width: 768px) {
                .cursor-glow { display: none; }
                .back-to-top {
                    bottom: 20px;
                    right: 20px;
                    width: 45px;
                    height: 45px;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // 10. 卡片鼠标倾斜 + 高光（桌面端）
    const enableCardTilt = () => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (reduced || !canHover) return; // 尊重无动画与触屏设备

        const cards = document.querySelectorAll('.flip-card');
        const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

        cards.forEach(card => {
            let rect;
            const onEnter = () => {
                rect = card.getBoundingClientRect();
                card.style.setProperty('--shine', '1');
                card.style.willChange = 'transform';
            };
            const onMove = (e) => {
                if (!rect) rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const px = x / rect.width;  // 0..1
                const py = y / rect.height; // 0..1

                // 倾斜角：最大 8deg
                const rotY = (px - 0.5) * 16; // -8..8
                const rotX = (0.5 - py) * 16; // -8..8

                card.style.setProperty('--tiltX', rotX.toFixed(2) + 'deg');
                card.style.setProperty('--tiltY', rotY.toFixed(2) + 'deg');
                card.style.setProperty('--glowX', clamp(Math.round(px * 100), 0, 100) + '%');
                card.style.setProperty('--glowY', clamp(Math.round(py * 100), 0, 100) + '%');
                card.style.setProperty('--tz', '12px');
            };
            const onLeave = () => {
                card.style.setProperty('--tiltX', '0deg');
                card.style.setProperty('--tiltY', '0deg');
                card.style.setProperty('--shine', '0');
                card.style.setProperty('--tz', '0px');
                rect = null;
            };

            card.addEventListener('pointerenter', onEnter);
            card.addEventListener('pointermove', onMove);
            card.addEventListener('pointerleave', onLeave);
        });
    };

    // 初始化所有功能
    const init = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        addAnimationStyles();
        observeElements();
        createScrollProgress();
        createBackToTop();
        animateStats();
        // enhanceTimeDisplay(); // 已移除 - 用户不希望时钟有跳动效果
        
        // 延迟加载较重的功能
        setTimeout(() => {
            createCursorGlow();
            createParticles();
        }, 500);

        // 3D 倾斜交互
        enableCardTilt();

        console.log('✨ 动画增强模块已加载');
    };

    init();
})();
