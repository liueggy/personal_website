<?php
// 主题管理 API
header('Content-Type: application/json; charset=utf-8');
// 防止 PHP 警告/错误以 HTML 形式输出破坏 JSON
error_reporting(E_ALL);
ini_set('display_errors', '0');

$config_file = __DIR__ . '/../config/hero_themes.json';

function read_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $json = json_decode($raw, true);
    return is_array($json) ? $json : [];
}

function json_response($arr) {
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// 读取配置
function get_config() {
    global $config_file;
    if (!file_exists($config_file)) {
        return ['current_theme' => 'classic', 'themes' => []];
    }
    $content = @file_get_contents($config_file);
    if ($content === false) {
        return ['current_theme' => 'classic', 'themes' => []];
    }
    $data = json_decode($content, true);
    return is_array($data) ? $data : ['current_theme' => 'classic', 'themes' => []];
}

// 保存配置（带错误捕获）
function save_config($config, &$err = null) {
    global $config_file;
    $dir = dirname($config_file);
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
            $err = '无法创建配置目录: ' . $dir;
            return false;
        }
    }
    $json = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $ok = @file_put_contents($config_file, $json, LOCK_EX);
    if ($ok === false) {
        $last = error_get_last();
        $err = $last['message'] ?? '写入失败';
        return false;
    }
    @chmod($config_file, 0644);
    return true;
}

$input = read_json_input();
$action = $_GET['action'] ?? $_POST['action'] ?? ($input['action'] ?? 'get');

switch ($action) {
    case 'get':
        json_response([
            'code' => 200,
            'data' => get_config()
        ]);
        break; // unreachable

    case 'set':
        $theme = $_POST['theme'] ?? ($input['theme'] ?? '');
        if (!$theme) {
            json_response(['code' => 400, 'message' => '主题名称不能为空']);
        }

        $config = get_config();
        if (!isset($config['themes'][$theme])) {
            json_response(['code' => 404, 'message' => '主题不存在']);
        }

        $config['current_theme'] = $theme;
        $err = null;
        if (!save_config($config, $err)) {
            json_response(['code' => 500, 'message' => '保存失败：' . $err]);
        }

        json_response([
            'code' => 200,
            'message' => '主题切换成功',
            'data' => ['theme' => $theme]
        ]);
        break; // unreachable

    case 'update_config':
        $theme = $input['theme'] ?? '';
        $new_config = $input['config'] ?? null;
        
        if (!$theme || !$new_config) {
            json_response(['code' => 400, 'message' => '参数不完整']);
        }
        
        $config = get_config();
        if (!isset($config['themes'][$theme])) {
            json_response(['code' => 404, 'message' => '主题不存在']);
        }
        
        // 更新主题配置
        $config['themes'][$theme]['config'] = $new_config;
        
        $err = null;
        if (!save_config($config, $err)) {
            json_response(['code' => 500, 'message' => '保存失败：' . $err]);
        }
        
        json_response([
            'code' => 200,
            'message' => '配置已保存',
            'data' => ['theme' => $theme, 'config' => $new_config]
        ]);
        break; // unreachable

    default:
        json_response(['code' => 400, 'message' => '无效的操作']);
}
