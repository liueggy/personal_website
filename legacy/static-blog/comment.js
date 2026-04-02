// 简化评论系统 - 极简黑白风格
let currentPostId = null;

// 生成渐变色头像（根据名字生成不同颜色）
function generateAvatar(name) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    
    // 根据名字生成固定的色调
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 生成柔和的灰度渐变
    const lightness = 75 + (Math.abs(hash) % 15); // 75-90之间
    const color1 = `hsl(0, 0%, ${lightness}%)`;
    const color2 = `hsl(0, 0%, ${lightness - 10}%)`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <defs>
            <linearGradient id="grad${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
            </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#grad${Math.abs(hash)})"/>
        <text x="20" y="20" text-anchor="middle" dy=".35em" fill="#333" font-size="16" font-family="Arial,sans-serif" font-weight="600">${initial}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// 加载评论
async function loadComments(postId) {
    try {
        const response = await fetch(`/blog/comments?action=list&post_id=${postId}`);
        const result = await response.json();
        
        if (result.code === 200) {
            document.getElementById('commentCount').textContent = `(${result.data.total || 0})`;
            renderComments(result.data.comments || []);
        }
    } catch (error) {
        console.error('加载评论失败:', error);
    }
}

// 渲染评论列表
function renderComments(comments) {
    const container = document.getElementById('commentsList');
    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
                <p style="font-size:14px;margin:0;">暂无评论</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = comments.map(comment => renderComment(comment)).join('');
    
    // 绑定点赞事件
    document.querySelectorAll('.react-btn').forEach(btn => {
        const commentId = btn.dataset.id;
        const likedKey = `liked_comment_${commentId}`;
        const hasLiked = localStorage.getItem(likedKey) === 'true';
        
        // 如果已点赞，更新UI
        if (hasLiked) {
            btn.classList.add('liked');
            const svg = btn.querySelector('svg');
            if (svg) {
                svg.setAttribute('fill', 'currentColor');
            }
        }
        
        btn.addEventListener('click', handleReact);
    });
    
    // 绑定回复按钮事件
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', handleReply);
    });
}

// 渲染单条评论 - 增强版极简风格
function renderComment(comment, isReply = false, depth = 0) {
    const displayName = comment.name || '匿名用户';
    const avatar = generateAvatar(displayName);
    
    // 最多显示2层嵌套
    const maxDepth = 2;
    const showReplies = comment.replies && comment.replies.length > 0 && depth < maxDepth;
    
    const replies = showReplies
        ? `<div style="margin-top:8px;">
             ${comment.replies.map(reply => renderComment(reply, true, depth + 1)).join('')}
           </div>`
        : '';
    
    const likeCount = comment.likes || 0;
    const avatarSize = isReply ? '32px' : '40px';
    
    return `
        <article class="comment-item ${isReply ? 'reply-item' : ''}" data-id="${comment.id}">
            <div style="display:flex;gap:12px;">
                <div style="flex-shrink:0;">
                    <img src="${avatar}" 
                         class="comment-avatar" 
                         style="width:${avatarSize};height:${avatarSize};" 
                         alt="${escapeHtml(displayName)}的头像"
                         title="${escapeHtml(displayName)}">
                </div>
                <div style="flex:1;min-width:0;">
                    <header style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
                        <span class="comment-username">${escapeHtml(displayName)}</span>
                        <time class="comment-timestamp" datetime="${comment.created_at}">${formatDate(comment.created_at)}</time>
                    </header>
                    <section style="color:var(--text-primary);line-height:1.7;word-wrap:break-word;white-space:pre-wrap;font-size:14px;margin-bottom:10px;">
                        ${escapeHtml(comment.content)}
                    </section>
                    <footer style="display:flex;align-items:center;gap:16px;">
                        <button class="comment-action-btn react-btn" 
                                data-id="${comment.id}" 
                                data-type="like"
                                aria-label="点赞">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            <span>${likeCount > 0 ? likeCount : ''}</span>
                        </button>
                        <button class="comment-action-btn reply-btn" 
                                data-id="${comment.id}" 
                                data-name="${escapeHtml(displayName)}"
                                aria-label="回复">
                            回复
                        </button>
                    </footer>
                    <div class="reply-form-${comment.id}" style="display:none;"></div>
                    ${replies}
                </div>
            </div>
        </article>
    `;
}

// 发表评论
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitComment');
    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            const content = document.getElementById('commentContent').value.trim();
            const name = document.getElementById('commentName').value.trim() || '匿名用户';
            
            if (!content) {
                showStatus('请输入评论内容', 'error');
                return;
            }
            
            if (content.length > 500) {
                showStatus('评论内容不能超过500字', 'error');
                return;
            }
            
            this.disabled = true;
            this.textContent = '提交中...';
            
            try {
                const response = await fetch('/blog/comments?action=create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        post_id: currentPostId,
                        name: name,
                        content: content
                    })
                });
                
                const result = await response.json();
                
                if (result.code === 200) {
                    showStatus('评论成功', 'success');
                    document.getElementById('commentContent').value = '';
                    document.getElementById('commentName').value = '';
                    
                    // 立即重新加载评论
                    loadComments(currentPostId);
                } else {
                    showStatus(result.message || '评论失败', 'error');
                }
            } catch (error) {
                console.error('评论失败:', error);
                showStatus('评论失败，请重试', 'error');
            } finally {
                this.disabled = false;
                this.textContent = '发表';
            }
        });
    }
});

// 点赞 - 增强动画效果
async function handleReact(e) {
    const btn = e.currentTarget;
    const commentId = btn.dataset.id;
    const type = btn.dataset.type;
    
    // 检查是否已点赞
    const likedKey = `liked_comment_${commentId}`;
    const hasLiked = localStorage.getItem(likedKey) === 'true';
    
    if (hasLiked) {
        showStatus('已点赞', 'error');
        return;
    }
    
    btn.disabled = true;
    
    try {
        const response = await fetch('/blog/comments?action=react', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                comment_id: commentId,
                type: type
            })
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            const count = result.data.likes || 0;
            const countSpan = btn.querySelector('span');
            const svg = btn.querySelector('svg');
            
            // 更新UI
            if (countSpan) {
                countSpan.textContent = count;
            }
            if (svg) {
                svg.setAttribute('fill', 'currentColor');
            }
            
            // 添加liked类触发动画
            btn.classList.add('liked');
            
            // 记录点赞状态
            localStorage.setItem(likedKey, 'true');
            
            showStatus('已点赞', 'success');
        } else {
            showStatus(result.message || '操作失败', 'error');
        }
    } catch (error) {
        console.error('点赞失败:', error);
        showStatus('操作失败', 'error');
    } finally {
        btn.disabled = false;
    }
}

// 处理回复
function handleReply(e) {
    const btn = e.currentTarget;
    const commentId = btn.dataset.id;
    const replyToName = btn.dataset.name;
    const formContainer = document.querySelector(`.reply-form-${commentId}`);
    
    // 如果已经打开，则关闭
    if (formContainer.style.display === 'block') {
        formContainer.style.display = 'none';
        return;
    }
    
    // 关闭其他回复框
    document.querySelectorAll('[class^="reply-form-"]').forEach(el => {
        el.style.display = 'none';
    });
    
    // 显示内联回复表单 - 极简无边框样式
    formContainer.innerHTML = `
        <div class="inline-reply-form" style="padding:0;margin-top:8px;">
            <textarea class="reply-content" 
                      placeholder="写下你的回复..." 
                      maxlength="500" 
                      style="width:100%;min-height:80px;padding:10px 0;border:none;border-bottom:1px solid #e6e6e6;border-radius:0;resize:vertical;background:transparent;color:var(--text-primary);font-size:14px;margin-bottom:10px;box-sizing:border-box;line-height:1.6;transition:border-color 0.2s;" 
                      onfocus="this.style.borderBottomColor='#000'" 
                      onblur="this.style.borderBottomColor='#e6e6e6'"
                      autofocus></textarea>
            <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
                <input type="text" 
                       class="reply-name" 
                       placeholder="昵称（选填）" 
                       maxlength="20" 
                       style="flex:1;min-width:100px;max-width:160px;padding:6px 0;border:none;border-bottom:1px solid #e6e6e6;border-radius:0;background:transparent;color:var(--text-primary);font-size:13px;box-sizing:border-box;transition:border-color 0.2s;" 
                       onfocus="this.style.borderBottomColor='#000'" 
                       onblur="this.style.borderBottomColor='#e6e6e6'">
        <div style="display:flex;gap:8px;">
            <button class="cancel-reply-btn comment-action-btn" 
                style="padding:6px 0;background:transparent;border:none;color:#666;white-space:nowrap;">取消</button>
            <button class="submit-reply-btn" 
                data-parent="${commentId}" 
                style="padding:6px 16px;background:#000;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;white-space:nowrap;">发送</button>
        </div>
            </div>
        </div>
    `;
    formContainer.style.display = 'block';
    
    // 绑定提交回复事件
    formContainer.querySelector('.submit-reply-btn').addEventListener('click', submitReply);
    formContainer.querySelector('.cancel-reply-btn').addEventListener('click', () => {
        formContainer.style.display = 'none';
    });
}

// 提交回复
async function submitReply(e) {
    const btn = e.currentTarget;
    const parentId = btn.dataset.parent;
    const container = btn.closest('[class^="reply-form-"]');
    const content = container.querySelector('.reply-content').value.trim();
    const name = container.querySelector('.reply-name').value.trim() || '匿名用户';
    
    if (!content) {
        showStatus('请输入回复内容', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '发送中...';
    
    try {
        const response = await fetch('/blog/comments?action=create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                post_id: currentPostId,
                name: name,
                content: content,
                parent_id: parentId
            })
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            showStatus('回复成功', 'success');
            container.style.display = 'none';
            
            // 立即重新加载评论
            loadComments(currentPostId);
        } else {
            showStatus(result.message || '回复失败', 'error');
        }
    } catch (error) {
        console.error('回复失败:', error);
        showStatus('回复失败，请重试', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '发送';
    }
}

// 显示状态消息
function showStatus(message, type) {
    const statusEl = document.getElementById('commentStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? '#000' : '#e74c3c';
        setTimeout(() => statusEl.textContent = '', 2000);
    }
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化评论
window.addEventListener('DOMContentLoaded', () => {
    const slug = new URLSearchParams(window.location.search).get('slug') || 
                 window.location.pathname.split('/').pop();
    if (slug && slug !== 'article.html') {
        currentPostId = slug;
        // 延迟加载评论，确保文章内容先加载
        setTimeout(() => loadComments(slug), 1000);
    }
});
