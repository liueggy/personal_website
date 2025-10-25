<?php
/**
 * 生成默认SVG头像
 * 运行此脚本生成12个不同颜色的默认头像
 */

$colors = [
    ['bg' => '#FF6B6B', 'text' => '#FFF'], // 红色
    ['bg' => '#4ECDC4', 'text' => '#FFF'], // 青色
    ['bg' => '#45B7D1', 'text' => '#FFF'], // 蓝色
    ['bg' => '#FFA07A', 'text' => '#FFF'], // 橙色
    ['bg' => '#98D8C8', 'text' => '#FFF'], // 绿色
    ['bg' => '#F7DC6F', 'text' => '#333'], // 黄色
    ['bg' => '#BB8FCE', 'text' => '#FFF'], // 紫色
    ['bg' => '#85C1E2', 'text' => '#FFF'], // 天蓝
    ['bg' => '#F8B500', 'text' => '#FFF'], // 金色
    ['bg' => '#52B788', 'text' => '#FFF'], // 翠绿
    ['bg' => '#E63946', 'text' => '#FFF'], // 深红
    ['bg' => '#457B9D', 'text' => '#FFF'], // 深蓝
];

$icons = [
    // 笑脸
    '<circle cx="60" cy="65" r="8" fill="currentColor"/><circle cx="140" cy="65" r="8" fill="currentColor"/><path d="M60 120 Q100 150 140 120" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>',
    // 酷脸
    '<rect x="40" y="60" width="40" height="8" rx="4" fill="currentColor"/><rect x="120" y="60" width="40" height="8" rx="4" fill="currentColor"/><line x1="70" y1="120" x2="130" y2="120" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    // 眨眼
    '<circle cx="60" cy="65" r="8" fill="currentColor"/><path d="M120 65 Q140 60 160 65" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M65 115 Q100 135 135 115" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
    // 惊讶
    '<circle cx="60" cy="65" r="10" fill="currentColor"/><circle cx="140" cy="65" r="10" fill="currentColor"/><circle cx="100" cy="125" r="15" fill="none" stroke="currentColor" stroke-width="6"/>',
    // 开心
    '<path d="M40 65 Q60 50 80 65" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M120 65 Q140 50 160 65" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M55 110 Q100 145 145 110" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>',
    // 星星眼
    '<path d="M60 50 L65 70 L85 70 L70 82 L75 102 L60 90 L45 102 L50 82 L35 70 L55 70 Z" fill="currentColor"/><path d="M140 50 L145 70 L165 70 L150 82 L155 102 L140 90 L125 102 L130 82 L115 70 L135 70 Z" fill="currentColor"/><path d="M60 120 Q100 145 140 120" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
    // 可爱
    '<circle cx="55" cy="65" r="6" fill="currentColor"/><circle cx="145" cy="65" r="6" fill="currentColor"/><circle cx="40" cy="90" r="12" fill="currentColor" opacity="0.3"/><circle cx="160" cy="90" r="12" fill="currentColor" opacity="0.3"/><path d="M70 115 Q100 135 130 115" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
    // 调皮
    '<circle cx="60" cy="65" r="8" fill="currentColor"/><path d="M120 65 L140 60 L145 65 L140 70 L120 65" fill="currentColor"/><path d="M55 115 Q80 135 105 115" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
    // 害羞
    '<path d="M50 70 Q60 65 70 70" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M130 70 Q140 65 150 70" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="95" rx="15" ry="8" fill="currentColor" opacity="0.3"/><ellipse cx="150" cy="95" rx="15" ry="8" fill="currentColor" opacity="0.3"/><line x1="75" y1="125" x2="125" y2="125" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
    // 疑问
    '<circle cx="60" cy="65" r="7" fill="currentColor"/><circle cx="140" cy="65" r="7" fill="currentColor"/><path d="M70 120 Q100 110 130 120" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
    // 平静
    '<line x1="45" y1="65" x2="75" y2="65" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><line x1="125" y1="65" x2="155" y2="65" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><line x1="70" y1="120" x2="130" y2="120" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
    // 思考
    '<circle cx="60" cy="65" r="7" fill="currentColor"/><circle cx="140" cy="65" r="7" fill="currentColor"/><path d="M75 115 Q95 125 115 115" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="160" cy="40" r="4" fill="currentColor" opacity="0.5"/><circle cx="170" cy="30" r="3" fill="currentColor" opacity="0.3"/>',
];

for ($i = 0; $i < 12; $i++) {
    $color = $colors[$i];
    $icon = $icons[$i];
    
    $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="{$color['bg']}" rx="20"/>
  <g color="{$color['text']}">
    {$icon}
  </g>
</svg>
SVG;
    
    $filename = __DIR__ . "/avatar-" . ($i + 1) . ".svg";
    file_put_contents($filename, $svg);
    echo "Generated: avatar-" . ($i + 1) . ".svg\n";
}

echo "\n✅ 成功生成 12 个默认头像！\n";
echo "头像路径: /assets/avatars/avatar-{1-12}.svg\n";
