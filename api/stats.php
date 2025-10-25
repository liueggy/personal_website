<?php
// Simple site stats endpoint (PV/UV) with file storage and locking
// Endpoint:
//   GET /api/stats.php?action=track -> increments PV and (once per IP) UV, returns totals
// Response:
//   { code: 200, data: { pv, uv_total, today_pv, today_uv } }

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$action = isset($_GET['action']) ? $_GET['action'] : 'track';

$root = dirname(__DIR__);
$dataDir = $root . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$file = $dataDir . '/stats.json';

// Load current data with lock
function load_stats($file) {
    $default = [
        'pv' => 0,
        'uv_total' => 0,
        'visitors' => [], // set of ip hashes for total uv
        'daily' => [], // 'YYYY-MM-DD' => { pv, uv, ips: [] }
        'last_updated' => time(),
    ];
    if (!file_exists($file)) return $default;
    $fp = fopen($file, 'r');
    if (!$fp) return $default;
    if (flock($fp, LOCK_SH)) {
        $content = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        $data = json_decode($content, true);
        if (!is_array($data)) return $default;
        // ensure keys
        $data = array_merge($default, $data);
        return $data;
    }
    fclose($fp);
    return $default;
}

function save_stats($file, $data) {
    $tmp = $file . '.tmp';
    $fp = fopen($tmp, 'c+');
    if (!$fp) return false;
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    // atomic replace
    rename($tmp, $file);
    return true;
}

function ip_hash() {
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $salt = 'liueggy.live#2025';
    return sha1($ip . '|' . substr($ua, 0, 64) . '|' . $salt);
}

$today = (new DateTime('now', new DateTimeZone('UTC')))->setTimezone(new DateTimeZone(date_default_timezone_get()))->format('Y-m-d');

try {
    $stats = load_stats($file);

    if ($action === 'track') {
        // increment pv
        $stats['pv'] = isset($stats['pv']) ? intval($stats['pv']) + 1 : 1;

        // total UV by hashed ip
        $hash = ip_hash();
        if (!isset($stats['visitors'][$hash])) {
            $stats['visitors'][$hash] = 1;
            $stats['uv_total'] = isset($stats['uv_total']) ? intval($stats['uv_total']) + 1 : 1;
        }

        // daily
        if (!isset($stats['daily'][$today])) {
            $stats['daily'][$today] = [ 'pv' => 0, 'uv' => 0, 'ips' => [] ];
        }
        $stats['daily'][$today]['pv'] = intval($stats['daily'][$today]['pv']) + 1;
        if (!in_array($hash, $stats['daily'][$today]['ips'], true)) {
            $stats['daily'][$today]['ips'][] = $hash;
            $stats['daily'][$today]['uv'] = intval($stats['daily'][$today]['uv']) + 1;
        }

        $stats['last_updated'] = time();
        save_stats($file, $stats);

        $resp = [
            'code' => 200,
            'data' => [
                'pv' => intval($stats['pv']),
                'uv_total' => intval($stats['uv_total']),
                'today_pv' => intval($stats['daily'][$today]['pv']),
                'today_uv' => intval($stats['daily'][$today]['uv']),
            ]
        ];
        echo json_encode($resp, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($action === 'stats') {
        $todayData = $stats['daily'][$today] ?? ['pv' => 0, 'uv' => 0];
        $resp = [
            'code' => 200,
            'data' => [
                'pv' => intval($stats['pv']),
                'uv_total' => intval($stats['uv_total']),
                'today_pv' => intval($todayData['pv']),
                'today_uv' => intval($todayData['uv']),
            ]
        ];
        echo json_encode($resp, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo json_encode(['code' => 400, 'message' => 'invalid action']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['code' => 500, 'message' => 'server error']);
}
