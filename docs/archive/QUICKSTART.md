# 🚀 快速启动指南

## 一、立即修改管理员密码（⚠️ 必须）

编辑文件：`/www/wwwroot/liueggy.live/admin/api.php`

找到第15行，修改为：
```php
define('ADMIN_PASSWORD', password_hash('你的超强密码', PASSWORD_BCRYPT));
```

## 二、访问管理后台

1. 打开浏览器访问：`https://liueggy.live/admin/`
2. 输入用户名：`admin`
3. 输入密码：`你刚才设置的密码`
4. 登录成功！

## 三、测试新功能

### 1. 测试评论回复
- 访问首页留言板
- 点击任意留言的"回复"按钮
- 填写回复内容
- 提交查看效果

### 2. 测试验证码
- 尝试发布留言
- 输入验证码
- 点击验证码图片可刷新

### 3. 测试管理后台
- 查看统计数据
- 尝试隐藏/发布留言
- 查看筛选功能

## 四、自定义敏感词

编辑文件：`/www/wwwroot/liueggy.live/data/sensitive_words.txt`

每行添加一个敏感词，例如：
```
广告
垃圾
spam
```

保存后立即生效！

## 五、数据库状态检查

```bash
# 检查回复功能字段是否添加成功
mysql -uroot -p0f4d315877189b5a blog -e "DESC comments"

# 应该能看到：
# - parent_id (回复功能)
# - reply_to (回复目标)
```

## 六、权限检查

确保以下目录可写：
```bash
chmod 755 /www/wwwroot/liueggy.live/data/
chmod 644 /www/wwwroot/liueggy.live/data/sensitive_words.txt
```

## 七、清理缓存

浏览器中按 `Ctrl + Shift + R` 强制刷新页面，加载最新资源。

## 八、功能检查清单

- [ ] 管理员密码已修改
- [ ] 管理后台可以正常登录
- [ ] 评论回复功能正常
- [ ] 验证码显示正常
- [ ] 敏感词过滤生效
- [ ] 留言管理功能正常
- [ ] SEO标签已更新

## 🎉 完成！

您的网站已全面升级，享受新功能吧！

---

## 常见问题

### Q: 验证码不显示？
A: 确保PHP已安装GD库：`php -m | grep gd`

### Q: 管理后台无法登录？
A: 检查是否修改了密码，清除浏览器缓存重试

### Q: 回复功能不显示？
A: 确认数据库迁移已执行，刷新页面

### Q: 如何备份数据？
A: 
```bash
mysqldump -uroot -p0f4d315877189b5a blog > backup_$(date +%Y%m%d).sql
```

---

**需要帮助？** 查看 `ENHANCEMENT_REPORT.md` 获取详细文档
