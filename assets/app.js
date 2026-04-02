(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const api = (window.__SITE__ && window.__SITE__.api) || '/api/guestbook';

  // 旧的 Service Worker 会缓存带重定向的页面响应，导致 about/guestbook 导航报错。
  // 这里直接卸载旧 SW，避免继续拦截文档请求。
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => {
          if ('caches' in window) {
            return caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
          }
          return null;
        })
        .then(() => {
          console.log('🧹 已清理旧 Service Worker 与缓存');
        })
        .catch((error) => {
          console.log('清理 Service Worker 失败:', error);
        });
    });
  }

  // 字符计数
  const contentInput = $('#content');
  const charCurrent = $('#char-current');
  if (contentInput && charCurrent) {
    contentInput.addEventListener('input', () => {
      charCurrent.textContent = contentInput.value.length;
    });
  }

  // 导航链接激活状态
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');
  
  const updateActiveNav = () => {
    const scrollY = window.scrollY;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };
  
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  // Theme - 使用 html.light，默认亮色模式
  const themeBtn = $('#theme-toggle');
  const html = document.documentElement;

  const applyInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    if (!saved || saved === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  };

  const updateThemeIcon = () => {
    if (!themeBtn) return;
    const isLight = html.classList.contains('light');
    const moonIcon = themeBtn.querySelector('.moon-icon');
    const sunIcon = themeBtn.querySelector('.sun-icon');
    if (moonIcon && sunIcon) {
      // 亮色时显示太阳图标
      sunIcon.style.display = isLight ? 'block' : 'none';
      moonIcon.style.display = isLight ? 'none' : 'block';
    }
  };

  themeBtn && themeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    html.classList.toggle('light');
    const mode = html.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('theme', mode);
    updateThemeIcon();
  });

  applyInitialTheme();
  updateThemeIcon();

  // Year
  const year = new Date().getFullYear();
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = year;

  // Contact Modal
  const contacts = {
    wechat: { title: '微信', value: 'LT20050406', qr: '/qrcodes/wechat.jpg' },
    qq: { title: 'QQ', value: '3157487230', qr: '/qrcodes/qq.jpg' },
    email: { title: '邮箱', value: '1963287731qq@gmail.com', link: 'mailto:1963287731qq@gmail.com' }
  };
  const modal = $('#contact-modal');
  const modalBody = $('#modal-body');
  const modalClose = $('.modal-close');

  $$('.social-btn[data-type]').forEach(btn => {
    // 使用 touchstart 和 click 确保移动端兼容
    const handleClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const type = btn.dataset.type;
      const c = contacts[type];
      if (!c) return;
      
      let html = `<h3>${c.title}</h3><p><code>${esc(c.value)}</code></p>`;
      if (c.link) html += `<p><a href="${c.link}" style="color:var(--primary)">点击发送邮件</a></p>`;
      
      // 直接尝试加载二维码图片，不预先检查
      if (c.qr) {
        const extensions = ['jpg', 'png'];
        for (const ext of extensions) {
          const qrUrl = `/qrcodes/${type}.${ext}`;
          // 直接插入图片，让浏览器处理加载失败
          html += `<img src="${qrUrl}?_=${Date.now()}" alt="${c.title}二维码" onerror="this.style.display='none'" onload="this.style.display='block'" />`;
          break; // 只尝试第一个格式，简化逻辑
        }
      }
      
      modalBody.innerHTML = html;
      modal.classList.add('show');
    };
    
    // 同时监听 click 和 touchend 事件
    btn.addEventListener('click', handleClick);
    btn.addEventListener('touchend', handleClick);
  });

  // 关闭按钮 - 移动端兼容
  const closeModal = () => modal.classList.remove('show');
  modalClose && modalClose.addEventListener('click', closeModal);
  modalClose && modalClose.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeModal();
  });
  
  // 点击遮罩层关闭
  const modalOverlay = $('.modal-overlay');
  modalOverlay && modalOverlay.addEventListener('click', closeModal);
  
  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
  
  // 点击背景关闭 - 移动端兼容
  modal && modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  modal && modal.addEventListener('touchend', (e) => {
    if (e.target === modal) {
      e.preventDefault();
      closeModal();
    }
  });

  // Comments
  const listEl = $('#comment-list');
  const form = $('#comment-form');
  const tip = $('#form-tip');
  const loadingEl = $('#comment-loading');
  const emptyEl = $('#comment-empty');
  const commentsCount = $('#comments-count');
  const captchaQuestion = $('#captcha-question');
  const captchaToken = $('#captcha-token');
  const captchaRefreshBtn = $('#captcha-refresh');

  function esc(s) {
    return (s || '').toString().replace(/[&<>"]|'/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  let replyingTo = null; // 记录正在回复的评论

  function liTpl(c, isReply = false) {
    const avatar = c.avatar || '/assets/avatars/avatar-1.svg';
    const replies = c.replies || [];
    const replyHtml = replies.length > 0 
      ? `<ul class="reply-list">${replies.map(r => liTpl(r, true)).join('')}</ul>` 
      : '';
    
    const replyToHtml = isReply && c.reply_to 
      ? `<span class="reply-to">回复 @${esc(c.reply_to)}</span>` 
      : '';
    
    return `<li class="comment-item${isReply ? ' reply-item' : ''}" data-id="${c.id}">
      <img src="${avatar}" alt="avatar" class="comment-avatar" onerror="this.src='/assets/avatars/avatar-1.svg'">
      <div class="comment-body">
        <div class="head">
          <div>
            <span class="name">${esc(c.name)}</span>
            ${c.contact ? `<span class="time"> · ${esc(c.contact)}</span>` : ''}
            ${replyToHtml}
          </div>
          <span class="time">${new Date(c.ts).toLocaleString()}</span>
        </div>
        <div class="content">${esc(c.content)}</div>
        <div class="ops">
          <button class="like" data-id="${c.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span>${c.likes || 0}</span>
          </button>
          <button class="reply-btn" data-id="${c.id}" data-name="${esc(c.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            回复
          </button>
        </div>
      </div>
      ${replyHtml}
    </li>`;
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `请求失败(${res.status})`);
    return data;
  }

  async function loadComments() {
    if (!listEl) return;
    try {
      if (loadingEl) loadingEl.style.display = 'flex';
      if (emptyEl) emptyEl.style.display = 'none';
      
      const data = await fetchJSON(`${api}?_=${Date.now()}`);
      
      if (loadingEl) loadingEl.style.display = 'none';
      
      if (!data.comments || data.comments.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'flex';
        if (commentsCount) commentsCount.textContent = '0';
        return;
      }
      
      listEl.innerHTML = data.comments.map(liTpl).join('');
      if (emptyEl) emptyEl.style.display = 'none';
      if (commentsCount) commentsCount.textContent = data.comments.length;
    } catch (e) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) {
        emptyEl.style.display = 'flex';
          const warnSvg = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`;
          emptyEl.innerHTML = `<div class="empty-icon">${warnSvg}</div><p>加载失败: ${e.message}</p>`;
      }
    }
  }

  async function submitComment(payload) {
    return fetchJSON(api, { method: 'POST', body: JSON.stringify(payload) });
  }

  async function loadChallenge() {
    if (!captchaQuestion || !captchaToken) return;
    try {
      const data = await fetchJSON(`${api}?action=challenge&_=${Date.now()}`);
      captchaQuestion.textContent = `请完成计算: ${data.challenge.prompt}`;
      captchaToken.value = data.challenge.token;
    } catch (err) {
      captchaQuestion.textContent = '验证题加载失败，请稍后刷新重试';
      captchaToken.value = '';
    }
  }

  listEl && listEl.addEventListener('click', async (e) => {
    // 点赞
    const likeBtn = e.target.closest('.like');
    if (likeBtn) {
      const id = likeBtn.dataset.id;
      likeBtn.disabled = true;
      try {
        const data = await submitComment({ action: 'like', id });
        likeBtn.querySelector('span').textContent = data.likes;
        tip.textContent = '';
      } catch (err) {
        tip.textContent = err.message;
      } finally {
        likeBtn.disabled = false;
      }
      return;
    }
    
    // 回复
    const replyBtn = e.target.closest('.reply-btn');
    if (replyBtn) {
      const id = replyBtn.dataset.id;
      const name = replyBtn.dataset.name;
      replyingTo = { id, name };
      
      // 更新表单提示
      const formTitle = document.querySelector('.comment-form-wrapper h4');
      if (!formTitle) {
        const wrapper = document.querySelector('.comment-form-wrapper');
        const title = document.createElement('h4');
        title.style.cssText = 'margin-bottom:15px;color:var(--primary);font-size:14px;';
        wrapper.insertBefore(title, form);
      }
      
      const titleEl = document.querySelector('.comment-form-wrapper h4');
      if (titleEl) {
        titleEl.innerHTML = `正在回复 <strong>${esc(name)}</strong> <button type="button" onclick="cancelReply()" style="margin-left:10px;padding:4px 8px;background:#f3f4f6;border:none;border-radius:4px;cursor:pointer;font-size:12px;">取消</button>`;
      }
      
      // 滚动到表单
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#content').focus();
    }
  });
  
  // 取消回复
  window.cancelReply = function() {
    replyingTo = null;
    const titleEl = document.querySelector('.comment-form-wrapper h4');
    if (titleEl) titleEl.remove();
  };

  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    tip.textContent = '';
    const name = $('#name').value.trim();
    const contact = $('#contact').value.trim();
    const content = $('#content').value.trim();
    const captcha = $('#captcha').value.trim();
    const challengeToken = captchaToken ? captchaToken.value.trim() : '';
    const agree = $('#agree').checked;

    if (!agree) return (tip.textContent = '请先勾选同意展示留言');
    if (name.length < 1) return (tip.textContent = '请填写称呼');
    if (content.length < 1 || content.length > 500) return (tip.textContent = '留言长度应为 1~500 字');
    if (!captcha) return (tip.textContent = '请输入验证答案');
    if (!challengeToken) return (tip.textContent = '验证题尚未加载完成，请刷新题目');

    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline';
    
    try {
      const payload = {
        action: 'create',
        name,
        contact,
        content,
        challenge_answer: captcha,
        challenge_token: challengeToken
      };
      
      // 如果是回复
      if (replyingTo) {
        payload.parent_id = replyingTo.id;
        payload.reply_to = replyingTo.name;
      }
      
      await submitComment(payload);
      $('#content').value = '';
      $('#captcha').value = '';
      await loadChallenge();
      
      cancelReply();
      await loadComments();
      tip.style.color = 'var(--primary)';
      tip.textContent = '✓ 提交成功！';
      setTimeout(() => { tip.textContent = ''; tip.style.color = ''; }, 3000);
    } catch (err) {
      tip.style.color = '#ef4444';
      tip.textContent = err.message || '提交失败，请稍后重试';
      await loadChallenge();
    } finally {
      btn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  });

  loadComments();
  loadChallenge();
  captchaRefreshBtn && captchaRefreshBtn.addEventListener('click', loadChallenge);
})();
