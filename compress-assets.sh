#!/bin/bash
# JavaScript 和 CSS 压缩脚本
# 需要安装: npm install -g terser csso-cli

ASSETS_DIR="/www/wwwroot/liueggy.live/assets"

echo "🚀 开始压缩静态资源..."

# 压缩 JavaScript 文件
echo "📦 压缩 JavaScript..."
for file in $ASSETS_DIR/*.js; do
    if [[ ! "$file" =~ \.min\. ]]; then
        filename=$(basename "$file" .js)
        echo "  压缩: $filename.js"
        terser "$file" -c -m -o "${ASSETS_DIR}/${filename}.min.js" 2>/dev/null || echo "  ⚠️  跳过 $filename.js (terser 未安装)"
    fi
done

# 压缩 CSS 文件
echo "📦 压缩 CSS..."
for file in $ASSETS_DIR/*.css; do
    if [[ ! "$file" =~ \.min\. ]]; then
        filename=$(basename "$file" .css)
        echo "  压缩: $filename.css"
        csso "$file" -o "${ASSETS_DIR}/${filename}.min.css" 2>/dev/null || echo "  ⚠️  跳过 $filename.css (csso 未安装)"
    fi
done

# 生成 gzip 预压缩文件
echo "📦 生成 gzip 预压缩文件..."
for file in $ASSETS_DIR/*.{js,css} $ASSETS_DIR/*.min.{js,css}; do
    if [ -f "$file" ]; then
        gzip -9 -k -f "$file" 2>/dev/null
        echo "  生成: $(basename "$file").gz"
    fi
done

echo "✅ 压缩完成!"
echo ""
echo "💡 提示:"
echo "1. 修改 HTML 中的引用从 .js/.css 改为 .min.js/.min.css"
echo "2. 配置 nginx 使用 gzip_static on 来使用预压缩文件"
echo "3. 确保版本号已更新强制刷新缓存"
