<?php
/**
 * 基于 MySQL 的留言接口
 * 路径：/www/wwwroot/liueggy.live/comments_db.php
 * 
 * 启用方式：修改 index.html 中的 window.__SITE__.api = '/comments_db.php'
 * 当前状态：准备就绪，但未启用（仍使用 comments.php + JSON）
 */

session_start();

// 强制 JSON 错误输出
ini_set('display_errors', '0');

$debugLog = __DIR__ . '/data/comments_debug.log';

set_error_handler(function($errno, $errstr, $errfile, $errline) use ($debugLog){
  error_log(date('[Y-m-d H:i:s] ') . "Error: $errstr in $errfile:$errline\n", 3, $debugLog);
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok'=>false,'message'=>'服务器错误','detail'=>[$errno,$errstr]], JSON_UNESCAPED_UNICODE);
  exit;
});
set_exception_handler(function($e) use ($debugLog){
  error_log(date('[Y-m-d H:i:s] ') . "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n", 3, $debugLog);
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok'=>false,'message'=>'服务器异常','detail'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/class/Database.php';
require_once __DIR__ . '/class/SensitiveWord.php';

function bad($msg, $code = 400) { 
  http_response_code($code); 
  echo json_encode(['ok' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE); 
  exit; 
}

function ok($payload) { 
  echo json_encode(array_merge(['ok' => true], $payload), JSON_UNESCAPED_UNICODE); 
  exit; 
}

function ip() {
  $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
  foreach ($keys as $k) { 
    if (!empty($_SERVER[$k])) { 
      return explode(',', $_SERVER[$k])[0]; 
    } 
  }
  return '0.0.0.0';
}

try {
  $db = Database::getInstance();
} catch (Exception $e) {
  bad('数据库连接失败: ' . $e->getMessage(), 500);
}

// GET: 获取留言列表
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  try {
    $comments = $db->query(
      "SELECT id, name, contact, content, avatar, likes, parent_id, reply_to,
              UNIX_TIMESTAMP(created_at) * 1000 as ts 
       FROM comments 
       WHERE status = 1 
       ORDER BY created_at DESC 
       LIMIT 100"
    );
    
    // 组织为树状结构
    $tree = [];
    $childrenMap = [];
    
    foreach ($comments as $comment) {
      if ($comment['parent_id'] == 0) {
        $comment['replies'] = [];
        $tree[] = $comment;
      } else {
        if (!isset($childrenMap[$comment['parent_id']])) {
          $childrenMap[$comment['parent_id']] = [];
        }
        $childrenMap[$comment['parent_id']][] = $comment;
      }
    }
    
    // 添加回复到父评论
    foreach ($tree as &$parent) {
      if (isset($childrenMap[$parent['id']])) {
        $parent['replies'] = $childrenMap[$parent['id']];
      }
    }
    
    ok(['comments' => $tree]);
  } catch (Exception $e) {
    bad('查询失败: ' . $e->getMessage(), 500);
  }
}

// POST: 创建或点赞
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

// 记录调试信息
error_log(date('[Y-m-d H:i:s] ') . "Mobile Debug - Raw Input: $raw\n", 3, $debugLog);
error_log(date('[Y-m-d H:i:s] ') . "Mobile Debug - JSON Decoded: " . json_encode($body) . "\n", 3, $debugLog);
error_log(date('[Y-m-d H:i:s] ') . "Mobile Debug - POST: " . json_encode($_POST) . "\n", 3, $debugLog);
error_log(date('[Y-m-d H:i:s] ') . "Mobile Debug - Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set') . "\n", 3, $debugLog);

// 兼容移动端：如果 JSON 解析失败，尝试使用 $_POST
if (!is_array($body) || empty($body)) {
  $body = $_POST;
}
if (!is_array($body)) $body = [];

$action = $body['action'] ?? 'create';

// 频率限制（使用数据库或缓存，这里简化使用文件）
$rateFile = __DIR__ . '/data/rate_' . md5(ip());

// 初始化敏感词过滤器
$sensitiveWord = new SensitiveWord();

if ($action === 'create') {
  $name = trim((string)($body['name'] ?? ''));
  $contact = trim((string)($body['contact'] ?? ''));
  $content = trim((string)($body['content'] ?? ''));
  $parent_id = intval($body['parent_id'] ?? 0);
  $reply_to = trim((string)($body['reply_to'] ?? ''));
  $captcha = strtoupper(trim((string)($body['captcha'] ?? '')));

  if ($name === '' || mb_strlen($name) > 32) bad('称呼长度需 1~32');
  if ($content === '' || mb_strlen($content) > 500) bad('留言长度需 1~500');
  
  // 敏感词检测
  $checkName = $sensitiveWord->check($name);
  if ($checkName['found']) {
    bad('昵称包含敏感词：' . $checkName['word']);
  }
  
  $checkContent = $sensitiveWord->check($content);
  if ($checkContent['found']) {
    bad('留言内容包含敏感词：' . $checkContent['word']);
  }
  
  // 验证验证码
  if (!isset($_SESSION['captcha']) || $captcha === '') {
    bad('请输入验证码');
  }
  if ($_SESSION['captcha'] !== $captcha) {
    bad('验证码错误');
  }
  // 验证码5分钟有效
  if (isset($_SESSION['captcha_time']) && (time() - $_SESSION['captcha_time'] > 300)) {
    unset($_SESSION['captcha']);
    bad('验证码已过期，请刷新');
  }
  
  // 验证通过后清除验证码
  unset($_SESSION['captcha']);
  unset($_SESSION['captcha_time']);

  $now = time();
  $last = file_exists($rateFile) ? intval(file_get_contents($rateFile)) : 0;
  
  // 增强频率限制：15秒内只能提交一次
  if ($last && ($now - $last) < 15) {
    $waitTime = 15 - ($now - $last);
    bad("提交太频繁，请等待 {$waitTime} 秒后再试");
  }
  
  // 检查最近1小时内的提交次数（防止恶意刷屏）
  try {
    $hourlyCount = $db->query(
      "SELECT COUNT(*) as cnt FROM comments 
       WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
      [ip()]
    )[0]['cnt'] ?? 0;
    
    if ($hourlyCount >= 10) {
      bad('您的留言过于频繁，请1小时后再试');
    }
  } catch (Exception $e) {
    // 忽略查询错误，继续执行
  }

  try {
    $id = substr(bin2hex(random_bytes(8)), 0, 12);
    
    // 随机分配头像 (1-12)
    $avatarNum = rand(1, 12);
    $avatar = "/assets/avatars/avatar-{$avatarNum}.svg";
    
    $db->execute(
      "INSERT INTO comments (id, name, contact, content, avatar, ip, user_agent, status, parent_id, reply_to, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())",
      [$id, $name, $contact, $content, $avatar, ip(), $_SERVER['HTTP_USER_AGENT'] ?? '', $parent_id, $reply_to]
    );
    
    @file_put_contents($rateFile, (string)$now);
    ok(['id' => $id, 'avatar' => $avatar]);
  } catch (Exception $e) {
    bad('创建失败: ' . $e->getMessage(), 500);
  }
}

if ($action === 'like') {
  $id = (string)($body['id'] ?? '');
  if ($id === '') bad('缺少 id');
  
  try {
    $db->execute(
      "UPDATE comments SET likes = likes + 1 WHERE id = ? AND status = 1",
      [$id]
    );
    
    $row = $db->queryOne("SELECT likes FROM comments WHERE id = ?", [$id]);
    if (!$row) bad('未找到留言', 404);
    
    ok(['likes' => (int)$row['likes']]);
  } catch (Exception $e) {
    bad('点赞失败: ' . $e->getMessage(), 500);
  }
}

bad('不支持的操作', 400);
