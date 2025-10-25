<div align="center">

# 🌟 LiuEggy 个人网站

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fliueggy.live&style=for-the-badge)](https://liueggy.live)
[![GitHub last commit](https://img.shields.io/github/last-commit/liueggy/personal_website?style=for-the-badge)](https://github.com/liueggy/personal_website/commits/main)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

**成都理工大学机械工程系学生的技术空间**

[🌐 在线访问](https://liueggy.live) · [📝 博客](https://liueggy.live/blog) · [💬 留言板](https://liueggy.live/guestbook.html)

</div>

---

## ✨ 项目简介

这是一个功能完整的个人网站项目,集成了博客系统、留言板、后台管理等模块。采用响应式设计,支持深色/浅色主题切换,提供优质的用户体验。

### 核心特性

- 🎨 **现代化UI设计** - 简洁美观,深色/浅色双主题
- 📱 **完全响应式** - 完美适配桌面、平板、手机
- ⚡ **性能优化** - 页面预加载、资源压缩、CDN加速
- 🔒 **安全可靠** - XSS防护、SQL注入防护、敏感信息保护
- 🎭 **Live2D看板娘** - 可爱的动态角色增添趣味
- 🌈 **动画效果** - 流畅的过渡和交互动画

---

## 🛠️ 技术栈

### 前端技术

| 技术 | 说明 |
|------|------|
| **HTML5** | 语义化标签,SEO优化 |
| **CSS3** | Flexbox/Grid布局,CSS变量,动画 |
| **JavaScript (ES6+)** | 原生JS,无框架依赖 |
| **Marked.js** | Markdown解析器 |
| **Highlight.js** | 代码语法高亮 |
| **KaTeX** | 数学公式渲染 |

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **PHP** | 8.2+ | 服务端脚本语言 |
| **MySQL** | 5.7+ | 关系型数据库 |
| **Nginx** | 1.18+ | Web服务器 |

### 其他工具

- **Git** - 版本控制
- **Cloudflare** - CDN + SSL证书
- **Live2D Widgets** - 看板娘组件

---

## 📂 项目结构

```
personal_website/
├── 📄 index.html              # 首页 - 技能展示、时钟、博客预览
├── 📄 about.html              # 关于页 - 个人简介、技术栈
├── 📄 guestbook.html          # 留言板 - 访客互动
├── 📄 404.html                # 404错误页面
├── 📄 README.md               # 项目文档
├── 📄 .gitignore              # Git忽略规则
│
├── 📁 config/                 # 配置文件
│   └── database.php           # 数据库连接配置
│
├── 📁 blog/                   # 博客系统
│   ├── index.html             # 文章列表页
│   ├── article.html           # 文章详情页
│   └── api/                   # 博客API接口
│       └── index.php          # RESTful API
│
├── 📁 admin/                  # 后台管理系统
│   ├── index.html             # 留言管理
│   └── blog.html              # 博客管理
│
├── 📁 api/                    # 通用API接口
│   └── guestbook_api.php      # 留言板API
│
├── 📁 assets/                 # 静态资源
│   ├── style.css              # 主样式表
│   ├── app.js                 # 核心JS逻辑
│   ├── animations.js          # 动画效果
│   ├── page-prefetch.js       # 页面预加载
│   ├── avatars/               # 默认头像
│   └── images/                # 图片资源
│
├── 📁 uploads/                # 用户上传文件
│   └── avatars/               # 用户头像
│
└── 📁 qrcodes/                # 二维码存储
```

---

## 🚀 快速开始

### 环境要求

- **PHP**: 8.2 或更高版本
- **MySQL**: 5.7 或更高版本
- **Nginx/Apache**: 任意版本
- **操作系统**: Linux/Windows/macOS

### 安装步骤

1️⃣ **克隆项目**

```bash
git clone https://github.com/liueggy/personal_website.git
cd personal_website
```

2️⃣ **配置数据库**

创建数据库并导入表结构:

```sql
CREATE DATABASE personal_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `config/database.php`:

```php
<?php
return [
    'host' => 'localhost',
    'dbname' => 'personal_website',
    'username' => 'your_username',
    'password' => 'your_password',
    'charset' => 'utf8mb4'
];
```

3️⃣ **配置Web服务器**

**Nginx配置示例:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/personal_website;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\. {
        deny all;
    }
}
```

4️⃣ **设置文件权限**

```bash
chmod 755 -R ./
chmod 777 uploads/ qrcodes/
```

5️⃣ **访问网站**

打开浏览器访问: `http://your-domain.com`

---

## 📱 功能模块

### 🏠 首页 (index.html)

- ⏰ 实时时钟显示 + 动态问候语
- 💼 技能卡片翻转效果
- 📰 最新博客文章预览
- 🎭 Live2D看板娘互动

### 👨‍💻 关于页面 (about.html)

- 📝 个人简介和教育背景
- 🛠️ 技术栈可视化展示
- 📊 项目经历时间线
- 📫 多平台联系方式

### 📝 博客系统 (blog/)

- ✍️ Markdown编辑器
- 🏷️ 分类和标签管理
- 💬 文章评论功能
- 🔍 搜索和筛选
- 📈 阅读统计

### 💬 留言板 (guestbook.html)

- 📮 访客留言发布
- 🎨 自定义头像上传
- 📱 QQ/微信二维码展示
- 👍 点赞和回复
- 🔝 留言置顶

### 🔐 管理后台 (admin/)

- 📋 留言审核和管理
- ✏️ 博客发布和编辑
- 🗑️ 内容删除和恢复
- 📊 数据统计分析

---

## 🎨 主题定制

网站支持深色/浅色双主题,可通过修改 `assets/style.css` 中的 CSS 变量进行定制:

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #1a1a1a;
    --accent: #4a9eff;
    /* ... 更多变量 ... */
}

:root:not(.light) {
    --bg-primary: #0a0a0a;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    /* ... 暗色主题变量 ... */
}
```

---

## 🔒 安全性

- ✅ **XSS防护** - 所有用户输入经过HTML转义
- ✅ **SQL注入防护** - 使用PDO预处理语句
- ✅ **CSRF防护** - 表单令牌验证
- ✅ **文件上传安全** - 类型检查、大小限制
- ✅ **敏感信息保护** - .gitignore排除配置文件

---

## 📈 性能优化

- ⚡ **页面预加载** - 智能预加载导航目标
- 🗜️ **资源压缩** - CSS/JS压缩混淆
- 🌐 **CDN加速** - Cloudflare全球加速
- 🖼️ **图片优化** - WebP格式、懒加载
- 📦 **代码分割** - 按需加载第三方库

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request!

1. Fork 本项目
2. 创建新分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构代码
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具变动

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 👨‍💻 作者

**LiuEggy**

- 🎓 成都理工大学 · 机械工程系
- 🌐 网站: [https://liueggy.live](https://liueggy.live)
- 📧 邮箱: [1963287731qq@gmail.com](mailto:1963287731qq@gmail.com)
- 💻 GitHub: [@liueggy](https://github.com/liueggy)
- 📺 Bilibili: [444993481](https://space.bilibili.com/444993481)

---

## 🙏 致谢

- [Marked.js](https://marked.js.org/) - Markdown解析
- [Highlight.js](https://highlightjs.org/) - 代码高亮
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Live2D Widgets](https://github.com/stevenjoezhang/live2d-widget) - 看板娘组件
- [Font Awesome](https://fontawesome.com/) - 图标库

---

<div align="center">

**⭐ 如果这个项目对你有帮助,请给个Star! ⭐**

Made with ❤️ by LiuEggy

© 2025 LiuEggy · 追求卓越

</div>
