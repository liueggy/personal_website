# 🏗️ LiuEggy 网站架构文档

## 📋 目录
- [项目概览](#项目概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [前端架构](#前端架构)
- [后端架构](#后端架构)
- [数据库设计](#数据库设计)
- [服务器配置](#服务器配置)

---

## 🎯 项目概览

**项目名称**: LiuEggy 个人网站  
**域名**: liueggy.live  
**项目类型**: 个人博客 + 留言板 + 作品展示  
**部署方式**: 宝塔面板 + Nginx + PHP + MySQL  

### 核心功能
1. ✅ **个人主页** - 展示技能特长、个人简介
2. ✅ **博客系统** - 文章发布、浏览、管理
3. ✅ **留言板** - 访客留言、评论、点赞、回复
4. ✅ **后台管理** - 博客管理、留言审核

---

## 🛠️ 技术栈

### 前端技术
```
HTML5          - 语义化标签
CSS3           - 现代样式设计
JavaScript ES6 - 原生JS，无框架依赖
```

### 后端技术
```
PHP 8.2        - 服务端语言
MySQL 5.7+     - 关系型数据库
PDO            - 数据库抽象层
```

### 服务器环境
```
Nginx          - Web服务器
宝塔面板       - 服务器管理
SSL/TLS        - HTTPS加密（Let's Encrypt）
HTTP/2 & HTTP/3 (QUIC) - 现代协议支持
```

---

## 📁 目录结构

```
/www/wwwroot/liueggy.live/
│
├── 前端页面
│   ├── index.html              # 主页
│   ├── about.html              # 关于页面
│   ├── guestbook.html          # 留言板
│   └── 404.html                # 404错误页
│
├── 博客模块
│   └── blog/
│       ├── index.html          # 博客列表页
│       ├── article.html        # 文章详情页
│       ├── admin.html          # 博客管理后台
│       └── api.php             # 博客API接口
│
├── 管理后台
│   └── admin/
│       ├── index.html          # 后台首页
│       ├── blog.html           # 博客管理
│       └── api.php             # 管理API
│
├── 静态资源
│   └── assets/
│       ├── style.css           # 全局样式
│       ├── app.js              # 全局脚本
│       ├── images/             # 图片资源
│       └── avatars/            # 用户头像
│
├── 后端核心
│   ├── config/
│   │   └── database.php        # 数据库配置
│   ├── class/
│   │   ├── Database.php        # 数据库单例类
│   │   ├── BlogModel.php       # 博客数据模型
│   │   └── SensitiveWord.php   # 敏感词过滤
│   ├── comments_db.php         # 留言API（数据库版）
│   ├── comments.php            # 留言API（JSON版）
│   ├── blog_api.php            # 博客API
│   └── captcha.php             # 验证码生成
│
├── 数据库脚本
│   └── schema/
│       ├── create_blog_table.sql    # 博客表结构
│       └── add_reply_feature.sql    # 回复功能扩展
│
├── 数据存储
│   └── data/
│       ├── comments.json       # 留言数据（JSON备份）
│       └── comments_debug.log  # 调试日志
│
├── 二维码管理
│   └── qrcodes/
│       ├── data.json           # 二维码数据
│       └── images/             # 二维码图片
│
└── 配置文件
    ├── .htaccess               # Apache重写规则
    ├── .user.ini               # PHP配置
    ├── robots.txt              # 搜索引擎爬虫规则
    └── sitemap.xml             # 网站地图
```

---

## 🎨 前端架构

### 1. 页面结构

#### 主页 (index.html)
- **Hero区域**: 个人介绍、技能标签
- **技能特长**: 翻转卡片展示（嵌入式、机器视觉、三维设计、编程语言）
- **最新博客**: 动态加载最新文章
- **响应式设计**: 移动端适配

#### 留言板 (guestbook.html)
- **留言表单**: 昵称、联系方式、内容、验证码
- **留言列表**: 树状结构显示（支持回复）
- **互动功能**: 点赞、回复、表情
- **实时更新**: 无刷新提交

#### 博客系统 (blog/)
- **列表页**: 文章卡片、分页、筛选
- **详情页**: Markdown渲染、代码高亮、评论区
- **管理页**: 文章CRUD、富文本编辑器

### 2. 样式系统 (style.css)

```css
/* 设计特点 */
- CSS变量系统（主题切换）
- 暗色/亮色双主题
- 响应式网格布局
- 平滑过渡动画
- 移动优先设计

/* 关键CSS变量 */
:root {
  --bg-primary      暗色主背景
  --bg-secondary    暗色次背景
  --text-primary    主文字色
  --primary         主题色蓝色
  --border          边框色
  --radius-*        圆角规范
  --shadow-*        阴影层级
}
```

### 3. JavaScript架构 (app.js)

```javascript
/* 核心功能模块 */
- 主题切换（localStorage持久化）
- 留言提交（AJAX + 表单验证）
- 动态内容加载
- 平滑滚动导航
- 移动端菜单
- 验证码刷新
```

---

## ⚙️ 后端架构

### 1. MVC分层架构

```
┌─────────────────────────────────────┐
│         前端页面 (View)              │
│  index.html / guestbook.html / ...  │
└─────────────┬───────────────────────┘
              │ AJAX请求
┌─────────────▼───────────────────────┐
│         控制器 (Controller)          │
│  comments_db.php / blog_api.php     │
└─────────────┬───────────────────────┘
              │ 调用模型
┌─────────────▼───────────────────────┐
│          模型 (Model)                │
│  BlogModel.php / Database.php       │
└─────────────┬───────────────────────┘
              │ SQL查询
┌─────────────▼───────────────────────┐
│          数据库 (MySQL)              │
│     blog.comments / blog.posts      │
└─────────────────────────────────────┘
```

### 2. 核心类设计

#### Database.php - 数据库单例类
```php
class Database {
    // 单例模式
    private static $instance = null;
    
    // 核心方法
    - query()        // 查询多行
    - queryOne()     // 查询单行
    - execute()      // 执行增删改
    - lastInsertId() // 获取插入ID
    - 事务支持
}
```

#### BlogModel.php - 博客数据模型
```php
class BlogModel {
    - getList()          // 获取文章列表（分页）
    - getById()          // 根据ID获取文章
    - getBySlug()        // 根据slug获取文章
    - create()           // 创建文章
    - update()           // 更新文章
    - delete()           // 删除文章
    - incrementViewCount() // 增加浏览量
}
```

#### SensitiveWord.php - 敏感词过滤
```php
class SensitiveWord {
    - check()    // 检测敏感词
    - filter()   // 过滤替换敏感词
}
```

### 3. API接口设计

#### 留言API (comments_db.php)
```
GET  /comments_db.php           # 获取留言列表
POST /comments_db.php           # 发布留言
POST /comments_db.php?like=123  # 点赞留言
```

**请求示例**:
```json
{
  "name": "访客昵称",
  "contact": "联系方式（可选）",
  "content": "留言内容",
  "parent_id": 0,      // 0表示主评论，非0表示回复
  "reply_to": null     // 回复的评论ID
}
```

**响应示例**:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "LiuEggy",
      "content": "欢迎留言",
      "avatar": "default",
      "likes": 10,
      "ts": 1729584000000,
      "replies": []
    }
  ]
}
```

#### 博客API (blog_api.php)
```
GET    /blog/api.php?action=list              # 文章列表
GET    /blog/api.php?action=detail&id=123     # 文章详情
POST   /blog/api.php?action=create            # 创建文章
PUT    /blog/api.php?action=update&id=123     # 更新文章
DELETE /blog/api.php?action=delete&id=123     # 删除文章
```

### 4. 安全机制

```php
// 1. SQL注入防护
- PDO预编译语句
- 参数绑定

// 2. XSS防护
- htmlspecialchars() 输出转义
- 敏感词过滤

// 3. CSRF防护
- Session验证
- Token机制（后台）

// 4. 访问控制
- 管理后台密码保护
- Session验证

// 5. 限流保护
- IP限制
- 时间戳验证
```

---

## 🗄️ 数据库设计

### 数据库配置
```php
// config/database.php
host: localhost
port: 3306
database: blog
charset: utf8mb4
user: root
```

### 表结构设计

#### 1. comments（留言表）
```sql
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,           -- 昵称
  `contact` VARCHAR(100),                 -- 联系方式
  `content` TEXT NOT NULL,                -- 留言内容
  `avatar` VARCHAR(20) DEFAULT 'default', -- 头像标识
  `likes` INT DEFAULT 0,                  -- 点赞数
  `parent_id` INT DEFAULT 0,              -- 父评论ID
  `reply_to` INT DEFAULT NULL,            -- 回复的评论ID
  `status` TINYINT DEFAULT 1,             -- 状态：1显示 0隐藏
  `ip` VARCHAR(45),                       -- IP地址
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2. blog_posts（博客文章表）
```sql
CREATE TABLE `blog_posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,          -- 标题
  `slug` VARCHAR(200) UNIQUE NOT NULL,    -- URL别名
  `summary` TEXT,                         -- 摘要
  `content` LONGTEXT NOT NULL,            -- 内容（HTML）
  `cover_image` VARCHAR(500),             -- 封面图
  `author` VARCHAR(50) DEFAULT 'LiuEggy', -- 作者
  `status` ENUM('draft','published') DEFAULT 'draft', -- 状态
  `view_count` INT DEFAULT 0,             -- 浏览数
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 数据关系
```
comments (留言表)
├── parent_id = 0           → 主评论
└── parent_id > 0           → 回复评论
    └── reply_to            → 回复的具体评论ID
```

---

## 🌐 服务器配置

### Nginx配置 
**配置文件**: `/www/server/panel/vhost/nginx/html_liueggy.live.conf`

#### 核心配置
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    listen 443 quic;              # HTTP/3支持
    server_name liueggy.live;
    root /www/wwwroot/liueggy.live;
    index index.html;
    
    # SSL证书
    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # HTTP → HTTPS强制跳转
    if ($server_port != 443) {
        rewrite ^(/.*)$ https://$host$1 permanent;
    }
    
    # 博客路由
    location /blog {
        try_files $uri $uri/ /blog/index.html;
    }
    
    location /blog/api/ {
        try_files $uri /blog/api.php?$query_string;
    }
    
    # SEO友好的文章URL
    location ~ ^/blog/article/([a-zA-Z0-9_-]+)$ {
        try_files $uri /blog/article.html?slug=$1;
    }
    
    # PHP处理
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        include fastcgi.conf;
    }
    
    # 静态资源缓存
    location ~ \.(css|js)$ {
        expires 12h;
    }
    
    location ~ \.(jpg|jpeg|png|gif|svg)$ {
        expires 30d;
    }
}
```

### PHP配置
```ini
# .user.ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

### 安全配置
```nginx
# 禁止访问敏感文件
location ~ ^/(\.user\.ini|\.htaccess|\.git|\.env) {
    return 404;
}

# 禁止直接访问PHP目录
location ~ ^/(config|class)/ {
    deny all;
}
```

---

## 🔄 数据流向

### 留言功能数据流
```
1. 用户填写表单 (guestbook.html)
   ↓
2. JavaScript验证 + AJAX提交 (app.js)
   ↓
3. PHP接收处理 (comments_db.php)
   ↓ 
4. 敏感词过滤 (SensitiveWord.php)
   ↓
5. 数据库操作 (Database.php)
   ↓
6. MySQL存储 (comments表)
   ↓
7. 返回JSON响应
   ↓
8. 前端更新显示
```

### 博客发布流程
```
1. 管理员登录后台 (admin/blog.html)
   ↓
2. 富文本编辑器编写 (TinyMCE/Quill)
   ↓
3. AJAX提交 (blog_api.php?action=create)
   ↓
4. BlogModel处理 (BlogModel.php)
   ↓
5. 数据库存储 (blog_posts表)
   ↓
6. 生成SEO友好的slug
   ↓
7. 前台显示 (/blog/article/xxx)
```

---

## 📊 性能优化

### 前端优化
- ✅ CSS/JS资源压缩
- ✅ 图片懒加载
- ✅ 浏览器缓存策略
- ✅ CDN加速（字体、图标）
- ✅ 代码分割（按需加载）

### 后端优化
- ✅ 数据库索引优化
- ✅ PDO预编译缓存
- ✅ Opcache启用
- ✅ 静态资源Nginx直接处理
- ✅ Gzip压缩

### 数据库优化
- ✅ 合理索引（status, created_at）
- ✅ 查询限制（LIMIT 100）
- ✅ 连接池复用
- ✅ 慢查询日志监控

---

## 🔐 安全措施

### 应用层安全
1. **SQL注入防护**: PDO参数绑定
2. **XSS防护**: 输出转义、CSP策略
3. **CSRF防护**: Token验证
4. **敏感词过滤**: 内容审核
5. **访问限流**: IP频率限制

### 服务器安全
1. **HTTPS加密**: Let's Encrypt证书
2. **防火墙**: 宝塔面板防火墙
3. **文件权限**: 敏感目录访问限制
4. **日志监控**: 访问日志、错误日志

---

## 📈 未来扩展

### 短期计划
- [ ] 文章标签系统
- [ ] 评论回复通知
- [ ] 文章搜索功能
- [ ] RSS订阅

### 长期计划
- [ ] 用户系统（注册/登录）
- [ ] 文章收藏
- [ ] 多语言支持
- [ ] GraphQL API

---

## 📝 开发日志

| 日期 | 更新内容 |
|------|---------|
| 2024-10 | 初始版本上线 |
| 2024-10 | 留言板功能完成 |
| 2024-10 | 博客系统上线 |
| 2024-10 | 数据库迁移完成 |
| 2024-10 | 回复功能上线 |

---

## 📞 联系方式

**开发者**: LiuEggy  
**网站**: https://liueggy.live  
**邮箱**: （留言板留言）

---

*最后更新时间: 2024-10-22*
*文档版本: v1.0*
