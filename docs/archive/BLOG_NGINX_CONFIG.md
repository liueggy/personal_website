# 博客功能 Nginx 配置指南

## 📋 配置文件位置
```
/www/server/panel/vhost/nginx/html_liueggy.live.conf
```

## 🔧 需要添加的配置

在配置文件中找到 `#REWRITE-START` 这一行的**上方**，添加以下location规则:

```nginx
    # 博客相关路由配置
    location /blog {
        try_files $uri $uri/ /blog/index.html;
    }
    
    location /blog/api/ {
        try_files $uri /blog/api.php?$query_string;
    }
    
    location ~ ^/blog/article/([a-zA-Z0-9_-]+)$ {
        try_files $uri /blog/article.html?slug=$1;
    }
```

## 📝 完整配置示例

在你的配置文件中，应该看起来像这样:

```nginx
server
{
    listen 80;
    listen 443 ssl;
    server_name liueggy.live;
    root /www/wwwroot/liueggy.live;
    
    # ... SSL配置 ...
    
    # ========== 博客路由配置 START ==========
    # 博客首页和静态文件
    location /blog {
        try_files $uri $uri/ /blog/index.html;
    }
    
    # 博客API接口
    location /blog/api/ {
        try_files $uri /blog/api.php?$query_string;
    }
    
    # 博客文章详情页 (SEO友好URL)
    location ~ ^/blog/article/([a-zA-Z0-9_-]+)$ {
        try_files $uri /blog/article.html?slug=$1;
    }
    # ========== 博客路由配置 END ==========
    
    #REWRITE-START URL重写规则引用
    include /www/server/panel/vhost/rewrite/html_liueggy.live.conf;
    #REWRITE-END
    
    # ... 其他配置 ...
}
```

## 🎯 配置说明

### 1. `/blog` - 博客首页
- 访问 `https://liueggy.live/blog` 会加载 `/blog/index.html`
- 支持静态资源访问 (CSS、JS等)

### 2. `/blog/api/` - API接口
- 所有API请求转发到 `/blog/api.php`
- 例如: `GET /blog/api/?action=list` → `api.php?action=list`

### 3. `/blog/article/{slug}` - 文章详情页
- SEO友好的URL结构
- 例如: `https://liueggy.live/blog/article/my-first-post`
- 实际加载: `/blog/article.html?slug=my-first-post`

## 🚀 配置步骤

### 方法一: 使用宝塔面板 (推荐)

1. **登录宝塔面板**
   - 访问: `http://你的服务器IP:8888`

2. **打开网站设置**
   - 左侧菜单: 网站
   - 找到 `liueggy.live`
   - 点击 "设置"

3. **配置文件**
   - 点击 "配置文件" 选项卡
   - 找到 `#REWRITE-START` 这一行
   - 在它的**上方**粘贴博客路由配置
   - 点击 "保存"

4. **重载Nginx**
   - 宝塔面板会自动重载
   - 或手动点击: 软件商店 → Nginx → 重载配置

### 方法二: 命令行配置

```bash
# 1. 备份原配置
cp /www/server/panel/vhost/nginx/html_liueggy.live.conf \
   /www/server/panel/vhost/nginx/html_liueggy.live.conf.backup

# 2. 编辑配置文件
nano /www/server/panel/vhost/nginx/html_liueggy.live.conf
# 或使用 vim
vim /www/server/panel/vhost/nginx/html_liueggy.live.conf

# 3. 添加上面的博客路由配置

# 4. 测试配置语法
nginx -t

# 5. 重载Nginx
nginx -s reload
# 或
systemctl reload nginx
```

## ✅ 验证配置

配置完成后，访问以下URL测试:

1. **博客首页**
   ```
   https://liueggy.live/blog
   ```
   应该显示: 文章列表页面

2. **博客管理后台**
   ```
   https://liueggy.live/blog/admin.html
   ```
   应该显示: 登录界面 (用户名: admin, 密码: 666666qaz)

3. **API测试**
   ```
   https://liueggy.live/blog/api/?action=list&page=1
   ```
   应该返回: JSON格式的文章列表

4. **文章详情页** (发布文章后)
   ```
   https://liueggy.live/blog/article/my-first-post
   ```
   应该显示: 文章内容

## 🐛 常见问题

### 问题1: 404 Not Found
**原因**: Nginx配置未生效
**解决**: 
```bash
nginx -t  # 检查配置语法
nginx -s reload  # 重载配置
```

### 问题2: 403 Forbidden
**原因**: 文件权限问题
**解决**:
```bash
cd /www/wwwroot/liueggy.live
chown -R www:www blog/
chmod -R 755 blog/
```

### 问题3: API返回HTML而不是JSON
**原因**: location规则顺序错误
**解决**: 确保博客配置在 `#REWRITE-START` **之前**

### 问题4: 样式文件404
**原因**: CSS/JS路径错误
**解决**: 检查HTML中的资源路径是否以 `/blog/` 开头

## 📦 已创建的文件

```
/www/wwwroot/liueggy.live/
├── blog/
│   ├── index.html        # 博客首页 (文章列表)
│   ├── article.html      # 文章详情页
│   ├── admin.html        # 博客管理后台
│   ├── api.php           # 后端API
│   └── editor.js         # 富文本编辑器配置
├── schema/
│   └── create_blog_table.sql  # 数据库表结构
└── class/
    └── BlogModel.php     # 博客数据模型
```

## 🎨 功能特性

### 前台功能
- ✅ 文章列表展示 (带分页)
- ✅ 文章详情查看
- ✅ Markdown渲染支持
- ✅ 代码高亮显示
- ✅ 响应式设计
- ✅ SEO友好URL

### 后台功能
- ✅ 文章新增/编辑/删除
- ✅ 富文本编辑器 (Quill)
- ✅ 文章发布/草稿状态
- ✅ URL别名 (slug) 设置
- ✅ 摘要自动提取
- ✅ 统计信息显示

## 🔐 安全建议

1. **修改管理员密码**
   ```php
   // 在 blog/api.php 中修改
   define('ADMIN_PASSWORD', password_hash('你的新密码', PASSWORD_BCRYPT));
   ```

2. **限制管理后台访问**
   ```nginx
   location /blog/admin.html {
       allow 你的IP地址;
       deny all;
   }
   ```

3. **启用防火墙**
   - 在宝塔面板 → 安全 → 配置防火墙规则

## 📞 需要帮助?

如果配置过程中遇到问题:
1. 检查Nginx错误日志: `/www/wwwlogs/liueggy.live.error.log`
2. 检查PHP错误日志: `/www/wwwlogs/liueggy.live.log`
3. 使用浏览器F12查看Network请求

---

**配置时间**: 2025-10-22  
**版本**: 1.0
