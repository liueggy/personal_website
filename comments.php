<?php
// 简易文件存储留言接口
// 路径：/www/wwwroot/liueggy.live/comments.php
// 存储：/www/wwwroot/liueggy.live/data/comments.json

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$base = __DIR__;
$dataDir = $base . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'comments.json';
if (!is_dir($dataDir)) { @mkdir($dataDir, 0777, true); }
if (!file_exists($dataFile)) { file_put_contents($dataFile, json_encode(['comments' => []], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); }

function read_comments($file) {
  $fp = fopen($file, 'c+');
  if (!$fp) return ['comments' => []];
  flock($fp, LOCK_SH);
  $size = filesize($file);
  $raw = $size > 0 ? fread($fp, $size) : '';
  flock($fp, LOCK_UN);
  fclose($fp);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : ['comments' => []];
}

function write_comments($file, $data) {
  $fp = fopen($file, 'c+');
  if (!$fp) return false;
  flock($fp, LOCK_EX);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return true;
}

function ip() {
  $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
  foreach ($keys as $k) { if (!empty($_SERVER[$k])) { return explode(',', $_SERVER[$k])[0]; } }
  return '0.0.0.0';
}

function bad($msg, $code = 400) { http_response_code($code); echo json_encode(['ok' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE); exit; }
function ok($payload) { echo json_encode(array_merge(['ok' => true], $payload), JSON_UNESCAPED_UNICODE); exit; }

// GET: list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $data = read_comments($dataFile);
  // 按时间倒序
  usort($data['comments'], function ($a, $b) { return ($b['ts'] ?? 0) <=> ($a['ts'] ?? 0); });
  ok(['comments' => $data['comments']]);
}

// POST: create or like
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) $body = [];
$action = $body['action'] ?? 'create';

// 简单频率限制：同一 IP 15 秒内仅允许一次创建
$rateFile = $dataDir . DIRECTORY_SEPARATOR . 'rate_' . md5(ip());

if ($action === 'create') {
  $name = trim((string)($body['name'] ?? ''));
  $contact = trim((string)($body['contact'] ?? ''));
  $content = trim((string)($body['content'] ?? ''));

  if ($name === '' || mb_strlen($name) > 32) bad('称呼长度需 1~32');
  if ($content === '' || mb_strlen($content) > 500) bad('留言长度需 1~500');

  $now = time();
  $last = @intval(@file_get_contents($rateFile));
  if ($last && ($now - $last) < 15) bad('提交太频繁，请稍后再试');

  $data = read_comments($dataFile);
  $id = substr(bin2hex(random_bytes(8)), 0, 12);
  $data['comments'][] = [
    'id' => $id,
    'name' => $name,
    'contact' => $contact,
    'content' => $content,
    'likes' => 0,
    'ip' => ip(),
    'ts' => $now * 1000
  ];
  if (!write_comments($dataFile, $data)) bad('写入失败，请稍后重试', 500);
  @file_put_contents($rateFile, (string)$now);
  ok(['id' => $id]);
}

if ($action === 'like') {
  $id = (string)($body['id'] ?? '');
  if ($id === '') bad('缺少 id');
  $data = read_comments($dataFile);
  $found = false; $likes = 0;
  foreach ($data['comments'] as &$c) {
    if ($c['id'] === $id) { $c['likes'] = intval($c['likes'] ?? 0) + 1; $likes = $c['likes']; $found = true; break; }
  }
  if (!$found) bad('未找到留言', 404);
  if (!write_comments($dataFile, $data)) bad('写入失败', 500);
  ok(['likes' => $likes]);
}

bad('不支持的操作', 400);
