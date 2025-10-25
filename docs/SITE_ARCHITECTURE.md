# 网站架构文档 - LiuEggy.live

> 最后更新：2025-10-25

## 📋 目录

- [系统概览](#系统概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [数据库设计](#数据库设计)
- [API 接口](#api-接口)
- [前端架构](#前端架构)
- [主题系统](#主题系统)
- [部署环境](#部署环境)

---

## 系统概览

LiuEggy.live 是一个基于 LNMP（Linux + Nginx + MySQL + PHP）的个人网站，包含博客、留言板和后台管理系统。

### 核心功能

- ✅ 个人主页展示
- ✅ 博客文章系统（Markdown 编辑器）
- ✅ 留言/评论系统
- ✅ 后台管理面板
- ✅ 主题切换（亮色/暗色）
- ✅ Service Worker 缓存
- ✅ 敏感词过滤

---

## 技术栈

### 前端
- **框架**: 原生 JavaScript（无框架）
- **样式**: CSS3 + CSS Variables
- **动画**: CSS Transitions + Intersection Observer API
- **Markdown**: Marked.js + highlight.js
- **缓存**: Service Worker
- **字体**: Inter (Google Fonts)

### 后端
- **语言**: PHP 8.2
- **数据库**: MySQL 5.7+ / MariaDB
- **Web 服务器**: Nginx 1.x
- **Session 管理**: PHP Session + Database

### 开发工具
- **版本控制**: Git
- **面板**: 宝塔 Linux 面板（可选）
- **监控**: 内置性能监控（`/assets/performance-monitor.js`）

---

## 目录结构

```
/www/wwwroot/liueggy.live/
├── index.html              # 首页
├── about.html             # 关于页面
├── guestbook.html         # 留言板
├── 404.html               # 404 页面
├── robots.txt             # SEO 爬虫规则
├── sitemap.xml            # 站点地图
├── sw.js                  # Service Worker
│
├── admin/                 # 后台管理系统
│   ├── index.html         # 管理面板主页
│   ├── api.php            # 后台 API（留言/评论管理）
│
├── blog/                  # 博客系统
│   ├── index.html         # 博客列表页
│   ├── article.html       # 文章详情页
│   ├── api.php            # 博客 API（增删改查）
│   ├── comment_api.php    # 评论 API
│   └── comment.js         # 评论组件
│
├── assets/                # 静态资源
│   ├── style.css          # 全局样式（11KB）
│   ├── app.js             # 全局脚本（主题、模态框等）
│   ├── animations.js      # 动画效果
│   ├── reveal.js          # 滚动动画
│   ├── page-prefetch.js   # 页面预加载
│   ├── performance-monitor.js # 性能监控
│   ├── avatars/           # 头像生成
│       ├── waifu-tips.json # 提示语配置
│       ├── models/        # 本地模型（6个）
│       │   ├── shizuku/
│       │   ├── haruto/
│       │   ├── koharu/
│       │   ├── hibiki/
│       │   ├── tororo/
│       │   └── wanko/
│       └── vendor/
│
├── class/                 # PHP 类库
│   ├── Database.php       # 数据库单例（PDO）
│   ├── BlogModel.php      # 博客模型
│   └── SensitiveWord.php  # 敏感词过滤
│
├── config/                # 配置文件
│   └── database.php       # 数据库配置
│
├── schema/                # 数据库表结构
│   ├── create_blog_table.sql
│   └── add_reply_feature.sql
│
├── data/                  # 运行时数据
│   ├── comments.json      # 旧留言备份
│   ├── sensitive_words.txt # 敏感词库
│   └── rate_*             # 限流记录
│
├── uploads/               # 上传文件
│   └── covers/            # 文章封面
│       └── 202510/
│
├── qrcodes/               # 二维码图片
│   ├── wechat.jpg
│   └── qq.jpg
│
└── docs/                  # 文档
    ├── SITE_ARCHITECTURE.md # 本文档
    └── archive/           # 历史文档
```

---

## 数据库设计

### 数据库：`blog`

#### 核心表

##### 1. `blog_posts` - 博客文章
```sql
CREATE TABLE `blog_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `content` longtext NOT NULL,
  `summary` text,
  `cover_image` varchar(500),
  `status` enum('draft','published') DEFAULT 'draft',
  `view_count` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### 2. `blog_comments` - 博客评论
```sql
CREATE TABLE `blog_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255),
  `content` text NOT NULL,
  `ip` varchar(45),
  `user_agent` varchar(500),
  `status` tinyint(1) DEFAULT 0,
  `likes` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### 3. `comments` - 留言板
```sql
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(100),
  `content` text NOT NULL,
  `ip` varchar(45),
  `user_agent` varchar(500),
  `status` tinyint(1) DEFAULT 0,
  `likes` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_page_id` (`page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```sql
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) DEFAULT 1,
  `model_id` int(11) DEFAULT 1,
  `model_texture_id` int(11) DEFAULT 53,
  `cdnPath` varchar(255),
  `tools` text,
  `position` enum('left','right') DEFAULT 'right',
  `drag` tinyint(1) DEFAULT 1,
  `size` varchar(20) DEFAULT '280x250',
  `bottom_offset` int(11) DEFAULT 0,
  `side_offset` int(11) DEFAULT 0,
  `message_delay` int(11) DEFAULT 6000,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### 5. `sessions` - 会话管理
```sql
CREATE TABLE `sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `data` text,
  `expires_at` timestamp,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

##### 6. `users` - 管理员用户
```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `email` varchar(255),
  `role` enum('admin','editor') DEFAULT 'editor',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## API 接口

### 1. 博客 API - `/blog/api.php`

#### 获取文章列表
```http
GET /blog/api/?action=list&status=published&page=1&pageSize=10
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [...],
    "total": 10,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 获取单篇文章
```http
GET /blog/api/?action=get&slug=my-first-post
```

#### 创建文章（需认证）
```http
POST /blog/api/
Content-Type: application/json
Authorization: Bearer {token}

{
  "action": "create",
  "title": "文章标题",
  "content": "Markdown 内容",
  "summary": "摘要",
  "status": "draft"
}
```

### 2. 评论 API - `/blog/comment_api.php`

#### 获取评论
```http
GET /blog/comment_api.php?action=list&post_id=1
```

#### 提交评论
```http
POST /blog/comment_api.php
Content-Type: application/json

{
  "action": "create",
  "post_id": 1,
  "name": "昵称",
  "content": "评论内容"
}
```

### 3. 留言 API - `/comments_db.php`

#### 获取留言
```http
GET /comments_db.php?action=get_comments&page_id=home
```

#### 提交留言
```http
POST /comments_db.php
Content-Type: application/json

{
  "action": "submit_comment",
  "page_id": "home",
  "name": "昵称",
  "content": "留言内容"
}
```

### 4. 管理 API - `/admin/api.php`

需要 Session 认证：`$_SESSION['admin_token']`

#### 登录
```http
POST /admin/api.php
{
  "action": "login",
  "username": "admin",
  "password": "password"
}
```

#### 统计数据
```http
GET /admin/api.php?action=stats&type=contact
Authorization: Bearer {token}
```


#### 获取配置（公开）
```http
```

#### 更新配置（需认证）
```http
Authorization: Bearer {token}

{
  "enabled": 1,
  "model_id": 2,
  "tools": ["hitokoto", "switch-model", "photo"]
}
```

---

## 前端架构

### 页面加载流程

```
1. HTML 解析
   ↓
2. <head> 内联脚本：主题初始化（避免闪烁）
   ↓
3. CSS 加载：/assets/style.css?v=11
   ↓
4. 页面渲染
   ↓
5. DOMContentLoaded
   ↓
6. /assets/app.js 加载（主题切换、模态框）
   ↓
7. 延迟脚本：reveal.js、animations.js
   ↓
8. Service Worker 注册
```

### 核心模块

#### 1. 主题系统（`/assets/app.js`）
- **存储**：`localStorage.theme`
- **默认**：亮色模式（`html.light`）
- **切换**：点击 `#theme-toggle` 按钮
- **图标同步**：`.moon-icon` / `.sun-icon`

#### 2. Service Worker（`/sw.js`）
- **缓存策略**：Cache First（静态资源）
- **版本**：v1
- **缓存内容**：CSS、JS、字体、图标

- **模型**：6 个本地模型（不依赖 CDN）
- **功能**：一言、换模、拍照、小游戏、隐藏

#### 4. 评论组件（`/blog/comment.js`）
- **渲染**：嵌套评论树
- **功能**：点赞、回复、头像生成
- **限流**：60秒/次

---

## 主题系统

### 问题修复（2025-10-25）

**问题：** `index.html` 和 `about.html` 内嵌主题切换代码 + `/assets/app.js` 重复绑定事件。

**解决方案：**
1. 移除页面内的主题切换逻辑
2. 统一使用 `/assets/app.js` 管理主题
3. 保留 `<head>` 内联脚本防止闪烁

### 实现细节

#### 初始化（防闪烁）
```html
<!-- 每个页面 <head> 内 -->
<script>
(function(){
  try{
    var t=localStorage.getItem('theme');
    if(!t||t==='light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
  }catch(e){
    document.documentElement.classList.add('light');
  }
})();
</script>
```

#### 统一管理（`/assets/app.js`）
```javascript
const themeBtn = $('#theme-toggle');
const html = document.documentElement;

themeBtn && themeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  html.classList.toggle('light');
  const mode = html.classList.contains('light') ? 'light' : 'dark';
  localStorage.setItem('theme', mode);
  updateThemeIcon();
});
```

### CSS 变量

亮色模式（默认）：
```css
html.light {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --primary: #4a9eff;
  /* ... */
}
```

暗色模式：
```css
html:not(.light) {
  --bg-primary: #0a0a0a;
  --text-primary: #e0e0e0;
  --primary: #5ba4ff;
  /* ... */
}
```

---


### 架构

```
Frontend (index.html)
    ↓
    ↓
    ↓
    ↓
Initialize with model JSON
    ↓
Inject toolbar (hitokoto, switch, photo, etc.)
```

### 本地化策略

**问题：** CDN 不稳定（jsDelivr 404、Cloudflare 缓存）

**解决方案：**
3. 移除所有外部依赖
4. 本地实现工具栏和提示

### 模型映射

| model_id | 名称    | 路径                                          |
|----------|---------|-----------------------------------------------|

### 后台管理

- **功能**：
  - 启用/禁用
  - 选择模型（下拉框）
  - 位置（左/右）
  - 工具按钮（多选）
  - 预览模型

---

## 部署环境

### 服务器配置

```
系统：Linux (宝塔面板)
路径：/www/wwwroot/liueggy.live/
PHP：8.2 (php-fpm)
MySQL：5.7+ (位于 /www/server/data/blog/)
Nginx：1.x
SSL：Cloudflare（自动）
```

### Nginx 配置要点

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}

location /blog/ {
    try_files $uri $uri/ /blog/index.html;
}

# 缓存控制
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

### 文件权限

```bash
# 网站目录
chown -R www:www /www/wwwroot/liueggy.live/

# 上传目录需要写权限
chmod 755 /www/wwwroot/liueggy.live/uploads/
chmod 755 /www/wwwroot/liueggy.live/data/

# 配置文件保护
chmod 600 /www/wwwroot/liueggy.live/config/database.php
```

### 数据库连接

```php
// /www/wwwroot/liueggy.live/config/database.php
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'blog',
    'username' => 'root',
    'password' => '***',  // 请修改
    'charset' => 'utf8mb4'
];
```

---

## 性能优化

### 已实施

- ✅ CSS/JS 压缩与版本控制（`?v=11`）
- ✅ Service Worker 缓存策略
- ✅ 图片懒加载（`loading="lazy"`）
- ✅ 字体异步加载（`media="print" onload`）
- ✅ 页面预加载（`<link rel="prefetch">`）
- ✅ DNS 预解析（`<link rel="dns-prefetch">`）
- ✅ Cloudflare CDN
- ✅ Gzip 压缩（Nginx）
- ✅ 浏览器缓存（`Cache-Control`）

### 监控

访问 `/?debug=performance` 启用性能监控面板。

---

## 安全措施

### 已实施

- ✅ SQL 注入防护（PDO + Prepared Statements）
- ✅ XSS 防护（`htmlspecialchars()` / `textContent`）
- ✅ CSRF Token（Session）
- ✅ 敏感词过滤（`/class/SensitiveWord.php`）
- ✅ 限流机制（IP + 时间戳）
- ✅ Session 管理（数据库存储）
- ✅ 密码哈希（`password_hash()`）
- ✅ HTTPS（Cloudflare SSL）

### 待加强

- ⚠️ 增加验证码（注册/登录/评论）
- ⚠️ 日志审计系统
- ⚠️ 备份自动化

---

## 常见问题

### 1. 主题切换无响应
**原因：** 重复绑定事件监听器。  
**解决：** 移除页面内嵌主题代码，统一使用 `/assets/app.js`。

**检查：**
1. API 是否返回 `enabled: 1`
2. 浏览器控制台是否有错误
3. 清除缓存并强制刷新（Ctrl+F5）

### 3. 博客文章保存失败
**检查：**
1. Session 是否过期
2. 数据库连接是否正常
3. PHP 错误日志：`/www/wwwlogs/*.log`

---

## 更新日志

### 2025-10-25
- ✅ 修复主题切换重复绑定问题
- ✅ 完善架构文档

### 2025-10-24
- ✅ 移除 CDN 依赖
- ✅ 添加管理后台设置

### 2025-10-22
- ✅ 博客系统上线
- ✅ Markdown 编辑器
- ✅ 评论功能

---

## 联系方式

- **开发者**: LiuEggy
- **邮箱**: 1963287731qq@gmail.com
- **GitHub**: [@liueggy](https://github.com/liueggy)

---

**文档版本：** 1.0.0  
**最后更新：** 2025-10-25 10:07 CST
