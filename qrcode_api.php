<?php
/**
 * 二维码API
 * GET /qrcode_api.php?type=wechat|qq
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/class/Database.php';

$type = $_GET['type'] ?? '';

if (!in_array($type, ['wechat', 'qq', 'all'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '无效的类型']);
    exit;
}

try {
    $db = Database::getInstance();
    
    if ($type === 'all') {
        $qrcodes = $db->query(
            "SELECT id, type, url, display_location FROM qrcodes WHERE is_active = 1"
        );
        echo json_encode(['ok' => true, 'data' => $qrcodes]);
    } else {
        $qrcode = $db->queryOne(
            "SELECT id, type, url, display_location FROM qrcodes WHERE type = ? AND is_active = 1",
            [$type]
        );
        
        if (!$qrcode) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => '未找到二维码']);
            exit;
        }
        
        echo json_encode(['ok' => true, 'data' => $qrcode]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '服务器错误: ' . $e->getMessage()]);
}
