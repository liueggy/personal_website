# 🎉 留言系统数据库版本 - 快速参考

## ✅ 切换完成

您的留言系统已成功切换到 MySQL 数据库存储！

---

## 📊 当前配置

| 项目 | 值 |
|------|-----|
| **存储方式** | MySQL 数据库 |
| **数据库名** | blog |
| **数据表** | comments |
| **API 接口** | /comments_db.php |
| **配置文件** | config/database.php |
| **状态** | ✅ 正常运行 |

---

## 🧪 快速测试

### 方法 1：通过网站测试
1. 访问：http://liueggy.live
2. 滚动到留言板
3. 提交一条测试留言
4. 查看是否正常显示

### 方法 2：通过 phpMyAdmin 查看
1. 访问：http://157.245.199.228:888
2. 登录（用户名：root）
3. 选择数据库：blog
4. 查看表：comments
5. 可以看到所有留言记录

### 方法 3：命令行查看
```bash
mysql -uroot -p blog -e "SELECT id, name, content, created_at FROM comments ORDER BY created_at DESC LIMIT 5;"
```

---

## 🔧 API 接口说明

### 获取留言列表
```
GET /comments_db.php?action=list
返回：{"ok":true,"comments":[...]}
```

### 提交新留言
```
POST /comments_db.php?action=add
参数：name, contact, content, agree
返回：{"ok":true,"id":"..."}
```

### 点赞留言
```
POST /comments_db.php?action=like
参数：id
返回：{"ok":true,"likes":数字}
```

---

## 📝 数据库表结构

```sql
CREATE TABLE comments (
  id VARCHAR(12) PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  contact VARCHAR(64),
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  status TINYINT DEFAULT 1,  -- 0=隐藏 1=显示 2=待审核
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## ⚙️ 站点配置

在 phpMyAdmin 中可以修改 `site_config` 表：

| 配置键 | 当前值 | 说明 |
|--------|--------|------|
| comment_max_length | 500 | 留言最大长度 |
| comment_need_review | 0 | 是否需要审核（0=否，1=是）|
| site_name | LiuEggy | 站点名称 |
| site_description | 热爱编程... | 站点描述 |

---

## 🛠️ 常用管理操作

### 查看所有留言
```bash
mysql -uroot -p blog -e "SELECT * FROM comments ORDER BY created_at DESC;"
```

### 查看留言统计
```bash
mysql -uroot -p blog -e "
SELECT 
  COUNT(*) as 总留言数,
  SUM(likes) as 总点赞数,
  COUNT(DISTINCT ip) as 访客数
FROM comments;"
```

### 删除垃圾留言
```sql
-- 在 phpMyAdmin 或命令行执行
DELETE FROM comments WHERE id = '留言ID';
```

### 隐藏某条留言
```sql
UPDATE comments SET status = 0 WHERE id = '留言ID';
```

### 批量审核留言
```sql
-- 将所有待审核的留言设为显示
UPDATE comments SET status = 1 WHERE status = 2;
```

---

## 🔒 安全建议

1. ✅ **已完成**：使用参数化查询（防 SQL 注入）
2. ✅ **已完成**：HTML 实体转义（防 XSS）
3. ✅ **已完成**：记录 IP 和 User Agent
4. 💡 **建议**：定期备份数据库
5. 💡 **建议**：启用留言审核功能（修改 comment_need_review 为 1）

---

## 💾 备份与恢复

### 备份留言数据
```bash
mysqldump -uroot -p blog comments > /www/backup/comments_backup_$(date +%Y%m%d).sql
```

### 恢复留言数据
```bash
mysql -uroot -p blog < /www/backup/comments_backup_20251021.sql
```

### 使用管理工具
```bash
/www/db_manager.sh
# 选择 "6. 创建新数据库" 或 "8. 备份数据库"
```

---

## 🔄 如需回滚到 JSON 版本

1. 修改 `/www/wwwroot/liueggy.live/index.html` 第 104 行：
   ```html
   <script>window.__SITE__={api:'/comments.php'};</script>
   ```

2. 修改 `/www/wwwroot/liueggy.live/assets/app.js` 第 4 行：
   ```javascript
   const api = (window.__SITE__ && window.__SITE__.api) || '/comments.php';
   ```

3. 清除浏览器缓存

---

## 📚 相关文件

- **留言接口**：`/www/wwwroot/liueggy.live/comments_db.php`
- **数据库配置**：`/www/wwwroot/liueggy.live/config/database.php`
- **数据库类**：`/www/wwwroot/liueggy.live/class/Database.php`
- **管理工具**：`/www/db_manager.sh`
- **完整文档**：`/www/docs/数据库管理指南.md`

---

## 🎯 下一步优化建议

1. **启用留言审核**：防止垃圾留言
   ```sql
   UPDATE site_config SET value='1' WHERE key='comment_need_review';
   ```

2. **设置自动备份**：每天自动备份数据库
   ```bash
   crontab -e
   # 添加：0 2 * * * mysqldump -uroot -p密码 blog > /www/backup/blog_$(date +\%Y\%m\%d).sql
   ```

3. **监控留言**：定期查看是否有不当内容

4. **性能优化**：如果留言很多，考虑添加分页功能

---

**文档生成时间**：<?php echo date('Y-m-d H:i:s'); ?>  
**数据库版本**：MySQL 5.7.44  
**存储引擎**：InnoDB
