<?php
/**
 * 简单验证码生成器
 * 路径：/www/wwwroot/liueggy.live/captcha.php
 */

session_start();

// 生成随机验证码
function generateCode($length = 4) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆的字符
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $code;
}

// 生成验证码
$code = generateCode(4);
$_SESSION['captcha'] = $code;
$_SESSION['captcha_time'] = time();

// 创建图像
$width = 120;
$height = 40;
$image = imagecreatetruecolor($width, $height);

// 颜色
$bgColor = imagecolorallocate($image, 245, 245, 245);
$textColor = imagecolorallocate($image, 50, 50, 50);
$lineColor = imagecolorallocate($image, 200, 200, 200);

// 填充背景
imagefilledrectangle($image, 0, 0, $width, $height, $bgColor);

// 绘制干扰线
for ($i = 0; $i < 5; $i++) {
    imageline($image, 
        rand(0, $width), rand(0, $height),
        rand(0, $width), rand(0, $height),
        $lineColor
    );
}

// 绘制干扰点
for ($i = 0; $i < 50; $i++) {
    imagesetpixel($image, rand(0, $width), rand(0, $height), $lineColor);
}

// 绘制验证码文字
$fontSize = 20;
$x = 10;
for ($i = 0; $i < strlen($code); $i++) {
    $angle = rand(-15, 15);
    $y = rand(28, 32);
    imagestring($image, 5, $x, $y - 20, $code[$i], $textColor);
    $x += 25;
}

// 输出图像
header('Content-Type: image/png');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
imagepng($image);
imagedestroy($image);
