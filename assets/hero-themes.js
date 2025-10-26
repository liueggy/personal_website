// 首页 Hero 区域主题模板
const heroThemes = {
    // 方案1: 命令行终端
    terminal: {
        html: function(config = {}) {
            const username = config.username || 'liueggy';
            const hostname = config.hostname || 'cdut-dev';
            const infoLines = config.infoLines || ['姓名: LiuEggy', '学校: 成都理工大学'];
            const skills = config.skills || [];
            
            return `
            <div class="terminal-window">
                <div class="terminal-header">
                    <div class="terminal-buttons">
                        <span class="terminal-btn close"></span>
                        <span class="terminal-btn minimize"></span>
                        <span class="terminal-btn maximize"></span>
                    </div>
                    <div class="terminal-title">${username}@${hostname} ~ zsh</div>
                </div>
                <div class="terminal-body">
                    <div class="terminal-line">
                        <span class="terminal-prompt">➜</span>
                        <span class="terminal-path">~</span>
                        <span class="terminal-command">cat welcome.txt</span>
                    </div>
                    <div class="terminal-output">
                        <span class="terminal-result" id="welcome-output"></span>
                        <span class="terminal-cursor">_</span>
                    </div>
                    <div class="terminal-line" style="margin-top: 16px;">
                        <span class="terminal-prompt">➜</span>
                        <span class="terminal-path">~</span>
                        <span class="terminal-command">cat info.txt</span>
                    </div>
                    <div class="terminal-output" id="info-output">
                        ${infoLines.map((_, i) => `<div class="info-line" id="info-line-${i}"></div>`).join('')}
                    </div>
                    <div class="terminal-line" style="margin-top: 16px;">
                        <span class="terminal-prompt">➜</span>
                        <span class="terminal-path">~</span>
                        <span class="terminal-command">cat skills.txt</span>
                    </div>
                    <div class="terminal-output terminal-skills">
                        ${skills.map((_, i) => `<div class="skill-line" id="skill-line-${i}"></div>`).join('')}
                    </div>
                    <div class="terminal-line" style="margin-top: 20px;">
                        <span class="terminal-prompt">➜</span>
                        <span class="terminal-path">~</span>
                        <span class="terminal-cursor blink">_</span>
                    </div>
                </div>
            </div>
            <div class="hero-badge" onclick="window.location.href='/admin/'" title="进入管理后台" style="position:absolute;top:20px;right:20px;cursor:pointer;background:rgba(74,158,255,0.1);padding:8px 16px;border-radius:20px;font-size:14px;color:var(--primary);transition:all 0.3s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Hi there
            </div>
            <div class="hero-actions" style="justify-content: center; margin-top: 40px;">
                <a href="/guestbook.html" class="btn btn-primary">留言交流</a>
                <a href="/about.html" class="btn btn-secondary">了解更多</a>
            </div>
        `;
        },
        css: `
            .terminal-window { max-width: 800px; margin: 0 auto; background: #1e1e1e; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
            .terminal-header { background: #2d2d2d; padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #3d3d3d; }
            .terminal-buttons { display: flex; gap: 8px; }
            .terminal-btn { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
            .terminal-btn.close { background: #ff5f56; }
            .terminal-btn.minimize { background: #ffbd2e; }
            .terminal-btn.maximize { background: #27c93f; }
            .terminal-title { color: #888; font-size: 13px; flex: 1; text-align: center; margin-right: 44px; }
            .terminal-body { padding: 24px; background: #1e1e1e; color: #d4d4d4; font-size: 15px; line-height: 1.6; min-height: 320px; }
            .terminal-line { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .terminal-prompt { color: #4EC9B0; font-weight: bold; }
            .terminal-path { color: #569CD6; }
            .terminal-command { color: #CE9178; }
            .terminal-output { margin-left: 24px; margin-bottom: 4px; }
            .terminal-result { color: #4FC1FF; font-weight: 600; font-size: 18px; }
            .info-line, .skill-line { color: #9CDCFE; margin: 4px 0; }
            .skill-line { display: flex; align-items: center; gap: 12px; }
            .skill-label { color: #C586C0; min-width: 120px; }
            .skill-value { color: #CE9178; }
            .terminal-cursor { display: inline-block; width: 8px; height: 18px; background: #4FC1FF; margin-left: 2px; vertical-align: text-bottom; }
            .terminal-cursor.blink { animation: blink-cursor 1s infinite; }
            @keyframes blink-cursor { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
            @media (max-width: 768px) {
                .terminal-window { margin: 0 16px; }
                .terminal-body { padding: 16px; font-size: 13px; }
                .terminal-result { font-size: 16px; }
            }
        `,
        init: async function(config = {}) {
            const welcomeText = config.welcomeText || '欢迎访问 LiuEggy 的个人空间';
            const infoLines = config.infoLines || ['姓名: LiuEggy', '学校: 成都理工大学'];
            const skills = config.skills || [];
            
            const typeWriter = (element, text, speed = 50) => {
                return new Promise((resolve) => {
                    let i = 0;
                    const timer = setInterval(() => {
                        if (i < text.length) {
                            element.textContent += text.charAt(i);
                            i++;
                        } else {
                            clearInterval(timer);
                            resolve();
                        }
                    }, speed);
                });
            };

            const welcomeOutput = document.getElementById('welcome-output');
            if (!welcomeOutput) return;

            await new Promise(resolve => setTimeout(resolve, 500));
            await typeWriter(welcomeOutput, welcomeText, 60);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 显示信息行
            for (let i = 0; i < infoLines.length; i++) {
                const lineEl = document.getElementById(`info-line-${i}`);
                if (lineEl) {
                    await typeWriter(lineEl, infoLines[i], 40);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 显示技能
            for (let i = 0; i < skills.length; i++) {
                const skillEl = document.getElementById(`skill-line-${i}`);
                if (skillEl && skills[i]) {
                    skillEl.innerHTML = `<span class="skill-label">${skills[i].label}</span><span class="skill-value">${skills[i].value}</span>`;
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }
    },

    // 方案2: 简约大字
    minimal: {
        html: function(config = {}) {
            const mainName = config.mainName || 'LiuEggy';
            const skills = config.skills || '嵌入式 · 视觉 · 设计';
            const school = config.school || '成都理工大学';
            const colors = config.gradientColors || ['#4a9eff', '#764ba2'];
            
            return `
            <div class="minimal-container">
                <div class="hero-badge" onclick="window.location.href='/admin/'" title="进入管理后台" style="position:absolute;top:20px;right:20px;cursor:pointer;background:rgba(74,158,255,0.1);padding:8px 16px;border-radius:20px;font-size:14px;color:var(--primary);transition:all 0.3s;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Hi there
                </div>
                <h1 class="minimal-name" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${mainName}</h1>
                <div class="minimal-divider" style="background: linear-gradient(90deg, ${colors[0]}, ${colors[1]});"></div>
                <p class="minimal-skills">${skills}</p>
                <p class="minimal-school">${school}</p>
                <div class="hero-actions" style="justify-content: center; margin-top: 50px;">
                    <a href="/guestbook.html" class="btn btn-primary">留言交流</a>
                    <a href="/about.html" class="btn btn-secondary">了解更多</a>
                </div>
            </div>
        `;
        },
        css: `
            .minimal-container { text-align: center; max-width: 900px; margin: 0 auto; padding: 60px 20px; }
            .minimal-name { font-size: clamp(72px, 15vw, 140px); font-weight: 900; margin: 0; letter-spacing: -0.02em; line-height: 1.3; padding: 15px 0 20px 0; overflow: visible; }
            .minimal-divider { width: 120px; height: 4px; margin: 30px auto; border-radius: 2px; }
            .minimal-skills { font-size: clamp(24px, 4vw, 36px); color: var(--text-primary); font-weight: 300; margin: 20px 0; letter-spacing: 0.05em; }
            .minimal-school { font-size: clamp(16px, 2.5vw, 20px); color: var(--text-secondary); margin-top: 10px; }
        `,
        init: function(config = {}) {
            // 简约主题无需额外初始化
        }
    },

    // 方案3: 渐变卡片
    gradient: {
        html: function(config = {}) {
            const mainTitle = config.mainTitle || 'LiuEggy';
            const subtitle = config.subtitle || '成都理工大学 · 机械工程系';
            const cards = config.cards || [
                {icon: '💻', label: '嵌入式开发', detail: 'STM32 · FreeRTOS'},
                {icon: '👁', label: '机器视觉', detail: 'OpenCV · YOLO'},
                {icon: '🎨', label: '三维设计', detail: 'SolidWorks'},
                {icon: '📍', label: '联系方式', detail: '成都 · 四川'}
            ];
            
            return `
            <div class="gradient-container">
                <div class="hero-badge" onclick="window.location.href='/admin/'" title="进入管理后台" style="position:absolute;top:20px;right:20px;cursor:pointer;background:rgba(74,158,255,0.1);padding:8px 16px;border-radius:20px;font-size:14px;color:var(--primary);z-index:10;transition:all 0.3s;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Hi there
                </div>
                <div class="gradient-card main-card">
                    <div class="card-title">${mainTitle}</div>
                    <div class="card-subtitle">${subtitle}</div>
                </div>
                <div class="gradient-cards-row">
                    ${cards.map(card => `
                        <div class="gradient-card skill-card">
                            <div class="card-icon">${card.icon}</div>
                            <div class="card-label">${card.label}</div>
                            <div class="card-detail">${card.detail}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="hero-actions" style="justify-content: center; margin-top: 40px;">
                    <a href="/guestbook.html" class="btn btn-primary">留言交流</a>
                    <a href="/about.html" class="btn btn-secondary">了解更多</a>
                </div>
            </div>
        `;
        },
        css: `
            .gradient-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            
            .gradient-card { 
                background: linear-gradient(135deg, rgba(74, 158, 255, 0.1), rgba(118, 75, 162, 0.1)); 
                backdrop-filter: blur(10px); 
                border: 1px solid rgba(255, 255, 255, 0.2); 
                border-radius: 20px; 
                padding: 40px; 
                margin-bottom: 20px; 
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                position: relative; 
                overflow: hidden;
                cursor: pointer;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }
            
            /* 光晕效果 */
            .gradient-card::before { 
                content: ''; 
                position: absolute; 
                top: 0;
                left: 0;
                width: 100%; 
                height: 100%; 
                background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.15), transparent 50%);
                transition: opacity 0.3s;
                opacity: 0;
                pointer-events: none;
            }
            
            /* 边框光效 */
            .gradient-card::after {
                content: '';
                position: absolute;
                inset: -2px;
                background: linear-gradient(45deg, #4a9eff, #764ba2, #4a9eff);
                border-radius: 20px;
                opacity: 0;
                z-index: -1;
                transition: opacity 0.4s;
                background-size: 200% 200%;
                animation: gradientShift 3s ease infinite;
            }
            
            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            /* 悬浮效果 */
            .gradient-card:hover {
                transform: translateY(-12px) scale(1.02);
                box-shadow: 0 24px 48px rgba(74, 158, 255, 0.25), 0 8px 16px rgba(0, 0, 0, 0.1);
                border-color: rgba(74, 158, 255, 0.5);
            }
            
            .gradient-card:hover::before { 
                opacity: 1;
            }
            
            .gradient-card:hover::after {
                opacity: 0.6;
            }
            
            /* 点击效果 */
            .gradient-card:active {
                transform: translateY(-8px) scale(0.98);
                box-shadow: 0 12px 24px rgba(74, 158, 255, 0.3);
            }
            
            /* Icon 动画 */
            .skill-card:hover .card-icon {
                transform: scale(1.2) rotateZ(5deg);
                filter: drop-shadow(0 0 12px rgba(74, 158, 255, 0.6));
            }
            
            .card-icon {
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            /* 主卡片特效 */
            .main-card { 
                text-align: center; 
                position: relative;
                z-index: 1;
            }
            
            .main-card:hover .card-title {
                transform: scale(1.05);
                filter: drop-shadow(0 4px 8px rgba(74, 158, 255, 0.3));
            }
            
            .card-title { 
                font-size: 48px; 
                font-weight: 800; 
                background: linear-gradient(135deg, var(--text-primary), var(--primary)); 
                -webkit-background-clip: text; 
                -webkit-text-fill-color: transparent; 
                background-clip: text; 
                margin-bottom: 12px;
                transition: all 0.3s ease;
            }
            
            .card-subtitle { 
                font-size: 18px; 
                color: var(--text-secondary); 
                transition: color 0.3s;
            }
            
            .main-card:hover .card-subtitle {
                color: var(--primary);
            }
            
            .gradient-cards-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .skill-card { text-align: center; padding: 30px 20px; }
            .card-label { 
                font-size: 20px; 
                font-weight: 600; 
                color: var(--text-primary); 
                margin-bottom: 8px;
                transition: all 0.3s;
            }
            .skill-card:hover .card-label {
                color: var(--primary);
                transform: translateY(-2px);
            }
            .card-detail { 
                font-size: 14px; 
                color: var(--text-secondary);
                transition: color 0.3s;
            }
            .skill-card:hover .card-detail {
                color: var(--text-primary);
            }
            
            @media (max-width: 768px) {
                .card-title { font-size: 36px; }
                .gradient-cards-row { grid-template-columns: 1fr; }
            }
        `,
        init: function(config = {}) {
            // 渐变卡片主题无需额外初始化
        }
    },

    // 方案4: 打字机效果
    typewriter: {
        html: function(config = {}) {
            const name = config.name || 'LiuEggy';
            const school = config.school || '成都理工大学';
            return `
            <div class="typewriter-container">
                <div class="hero-badge" onclick="window.location.href='/admin/'" title="进入管理后台" style="position:absolute;top:20px;right:20px;cursor:pointer;background:rgba(74,158,255,0.1);padding:8px 16px;border-radius:20px;font-size:14px;color:var(--primary);transition:all 0.3s;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Hi there
                </div>
                <div class="typewriter-content">
                    <div class="typewriter-prompt">&gt;</div>
                    <h2 class="typewriter-text" id="typewriter-text"><span class="typewriter-cursor">|</span></h2>
                </div>
                <p class="typewriter-subtitle">${name} · ${school}</p>
                <div class="hero-actions" style="justify-content: center; margin-top: 50px;">
                    <a href="/guestbook.html" class="btn btn-primary">留言交流</a>
                    <a href="/about.html" class="btn btn-secondary">了解更多</a>
                </div>
            </div>
        `;
        },
        css: `
            .typewriter-container { max-width: 900px; margin: 0 auto; padding: 80px 20px; text-align: center; }
            .typewriter-content { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 80px; }
            .typewriter-prompt { font-size: 48px; color: var(--primary); font-weight: bold; font-family: monospace; }
            .typewriter-text { 
                font-size: 48px; 
                font-weight: 700; 
                color: var(--text-primary); 
                margin: 0; 
                min-width: 50px; 
                text-align: left; 
                font-family: 'Inter', sans-serif;
                white-space: nowrap;
            }
            .typewriter-cursor { 
                font-size: 48px; 
                color: var(--primary); 
                animation: blink 1s infinite; 
                font-weight: 300;
                display: inline-block;
                margin-left: 2px;
            }
            .typewriter-subtitle { font-size: 20px; color: var(--text-secondary); margin-top: 30px; }
            @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
            @media (max-width: 768px) {
                .typewriter-prompt, .typewriter-text, .typewriter-cursor { font-size: 32px; }
                .typewriter-subtitle { font-size: 16px; }
            }
        `,
        init: function(config = {}) {
            const roles = config.roles || [
                '嵌入式工程师',
                '机器视觉开发者',
                '三维设计爱好者',
                'Python 程序员',
                'C/C++ 开发者',
                'LiuEggy'
            ];
            const typingSpeed = config.typingSpeed || 80;
            const deleteSpeed = config.deleteSpeed || 50;
            
            let currentIndex = 0;
            let charIndex = 0;
            let isDeleting = false;
            const textElement = document.getElementById('typewriter-text');
            
            function type() {
                if (!textElement) return;
                
                const currentRole = roles[currentIndex];
                const cursor = '<span class="typewriter-cursor">|</span>';
                
                if (isDeleting) {
                    textElement.innerHTML = currentRole.substring(0, charIndex - 1) + cursor;
                    charIndex--;
                } else {
                    textElement.innerHTML = currentRole.substring(0, charIndex + 1) + cursor;
                    charIndex++;
                }
                
                let typeSpeed = isDeleting ? deleteSpeed : typingSpeed;
                
                if (!isDeleting && charIndex === currentRole.length) {
                    typeSpeed = 2000;
                    isDeleting = true;
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    currentIndex = (currentIndex + 1) % roles.length;
                    typeSpeed = 500;
                }
                
                setTimeout(type, typeSpeed);
            }
            
            type();
        }
    },

    // 方案5: 经典布局
    classic: {
        html: function(config = {}) {
            const greeting = config.greeting || '哇，你终于来了';
            const name = config.name || 'LiuEggy';
            const tags = config.tags || ['成都理工', '嵌入式开发', '机器视觉', '三维设计'];
            const showClock = config.showClock !== false;
            
            return `
            <div class="hero-badge" onclick="window.location.href='/admin/'" title="进入管理后台" style="cursor:pointer;background:rgba(74,158,255,0.1);padding:8px 16px;border-radius:20px;font-size:14px;color:var(--primary);display:inline-flex;align-items:center;gap:6px;transition:all 0.3s;margin-bottom:30px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Hi there
            </div>
            ${showClock ? `
            <div class="time-flow-container">
                <div class="time-flow">
                    <div class="time-segment"><span class="time-value" id="hours">00</span></div>
                    <span class="time-separator">:</span>
                    <div class="time-segment"><span class="time-value" id="minutes">00</span></div>
                    <span class="time-separator">:</span>
                    <div class="time-segment"><span class="time-value" id="seconds">00</span></div>
                </div>
                <div class="time-quote" id="time-quote">时光流转，不负韶华</div>
            </div>
            ` : ''}
            <h2 class="hero-title">${greeting}，我是 <span class="gradient-text">${name}</span></h2>
            <div class="hero-tags" style="justify-content: center;">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="hero-actions" style="justify-content: center;">
                <a href="/guestbook.html" class="btn btn-primary">留言交流</a>
                <a href="/about.html" class="btn btn-secondary">了解更多</a>
            </div>
        `;
        },
        css: `
            /* 经典主题样式在全局 CSS 中已定义 */
        `,
        init: function(config = {}) {
            const showLiveTime = config.showLiveTime !== false;
            
            if (!showLiveTime) return;
            
            const updateTime = () => {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                
                const hoursEl = document.getElementById('hours');
                const minutesEl = document.getElementById('minutes');
                const secondsEl = document.getElementById('seconds');
                
                if (hoursEl) hoursEl.textContent = hours;
                if (minutesEl) minutesEl.textContent = minutes;
                if (secondsEl) secondsEl.textContent = seconds;
                
                const timeQuote = document.getElementById('time-quote');
                if (timeQuote) {
                    const hour = now.getHours();
                    if (hour >= 5 && hour < 9) {
                        timeQuote.textContent = '早安，美好的一天开始了';
                    } else if (hour >= 9 && hour < 12) {
                        timeQuote.textContent = '上午好，保持活力';
                    } else if (hour >= 12 && hour < 14) {
                        timeQuote.textContent = '午安，稍作休息';
                    } else if (hour >= 14 && hour < 18) {
                        timeQuote.textContent = '下午好，继续加油';
                    } else if (hour >= 18 && hour < 22) {
                        timeQuote.textContent = '晚上好，放松一下';
                    } else {
                        timeQuote.textContent = '夜深了，早点休息';
                    }
                }
            };
            
            updateTime();
            setInterval(updateTime, 1000);
        }
    }
};

// 加载当前主题
async function loadHeroTheme() {
    try {
        const response = await fetch('/api/theme.php?action=get');
        const data = await response.json();
        
        if (data.code === 200) {
            const currentTheme = data.data.current_theme || 'classic';
            const themeConfig = data.data.themes[currentTheme]?.config || {};
            applyTheme(currentTheme, themeConfig);
        }
    } catch (error) {
        console.error('加载主题失败:', error);
        applyTheme('classic', {});
    }
}

// 应用主题
function applyTheme(themeName, config = {}) {
    const theme = heroThemes[themeName];
    if (!theme) {
        console.error('主题不存在:', themeName);
        return;
    }
    
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;
    
    // 应用 HTML（支持函数或字符串）
    const html = typeof theme.html === 'function' ? theme.html(config) : theme.html;
    heroContent.innerHTML = html;
    
    // 应用 CSS
    let styleId = 'hero-theme-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = theme.css;
    
    // 运行初始化函数（传入配置）
    if (theme.init) {
        setTimeout(() => theme.init(config), 100);
    }
}

// 页面加载时应用主题
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeroTheme);
} else {
    loadHeroTheme();
}

// 导出供后台使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { heroThemes, applyTheme };
}
