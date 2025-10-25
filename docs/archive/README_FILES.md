# 📂 文件说明

## 网站功能文件

### 留言系统
- `comments.php` - JSON 版本的留言接口（原始版本）
- `comments_db.php` - 数据库版本的留言接口（推荐使用）

### 数据库相关
- `migrate.sql` - 数据库初始化脚本（备份保留）
- `migrate_json_to_db.php` - JSON 数据迁移到数据库工具

## 使用建议

### 如果您想使用数据库存储留言
1. 数据库已配置完成 ✓
2. 修改前端代码，将留言 API 从 `comments.php` 改为 `comments_db.php`
3. （可选）运行 `php migrate_json_to_db.php` 迁移现有 JSON 数据

### 如果您想继续使用 JSON 存储
1. 保持现状即可，继续使用 `comments.php`
2. 可以删除 `comments_db.php` 和 `migrate_json_to_db.php`

## 其他资源

- **文档**: `/www/docs/` - 数据库管理相关文档
- **工具**: `/www/db_manager.sh` - 数据库管理命令行工具

## 数据库连接信息

已配置完成，位于 `config/database.php`：
- 数据库：blog
- 字符集：utf8mb4
- 状态：✅ 正常运行

---

创建时间：<?php echo date('Y-m-d H:i:s'); ?>
