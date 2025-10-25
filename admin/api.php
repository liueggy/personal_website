<?php
/**
 * 管理后台 API
 * 路径：/www/wwwroot/liueggy.live/admin/api.php
 */

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../class/Database.php';

// 管理员配置（实际应用中应该存在数据库中并加密）
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', password_hash('666666qaz', PASSWORD_BCRYPT)); // 默认密码，请修改！

function response($ok, $data = [], $code = 200) {
    http_response_code($code);
    echo json_encode(array_merge(['ok' => $ok], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function checkAuth() {
    // 兼容CLI和Web环境获取headers
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                $headers[$header] = $value;
            }
        }
    }
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        response(false, ['message' => 'Unauthorized'], 401);
    }
    
    $token = $matches[1];
    if (!isset($_SESSION['admin_token']) || $_SESSION['admin_token'] !== $token) {
        response(false, ['message' => 'Unauthorized'], 401);
    }
    
    // 检查会话是否过期（8小时）
    if (isset($_SESSION['admin_login_time'])) {
        $elapsed = time() - $_SESSION['admin_login_time'];
        if ($elapsed > 28800) { // 8小时 = 28800秒
            session_destroy();
            response(false, ['message' => 'Session expired'], 401);
        }
    }
    
    return true;
}

try {
    $db = Database::getInstance();
} catch (Exception $e) {
    response(false, ['message' => '数据库连接失败'], 500);
}

$method = $_SERVER['REQUEST_METHOD'];

// POST 请求处理
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    // 登录
    if ($action === 'login') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if ($username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD)) {
            $token = bin2hex(random_bytes(32));
            $_SESSION['admin_token'] = $token;
            $_SESSION['admin_login_time'] = time();
            
            response(true, ['token' => $token, 'message' => '登录成功']);
        } else {
            response(false, ['message' => '用户名或密码错误'], 401);
        }
    }
    
    // 其他操作需要验证
    checkAuth();
    
    $type = $input['type'] ?? 'contact'; // contact = 留言板, blog = 博客评论
    $table = ($type === 'blog') ? 'blog_comments' : 'comments';
    
    // 切换状态
    if ($action === 'toggle') {
        $id = trim((string)($input['id'] ?? ''));
        $status = intval($input['status'] ?? 0);
        
        if ($id === '') {
            response(false, ['message' => '无效的ID']);
        }
        
        try {
            $affected = $db->execute(
                "UPDATE $table SET status = ? WHERE id = ?",
                [$status, $id]
            );
            
            if ($affected > 0) {
                response(true, ['message' => '操作成功', 'affected' => $affected]);
            } else {
                response(false, ['message' => '未找到该留言或状态未改变']);
            }
        } catch (Exception $e) {
            response(false, ['message' => '操作失败: ' . $e->getMessage()], 500);
        }
    }
    
    // 删除留言/评论
    if ($action === 'delete') {
        $id = trim((string)($input['id'] ?? ''));
        
        if ($id === '') {
            response(false, ['message' => '无效的ID']);
        }
        
        try {
            // 先检查是否存在
            $comment = $db->query("SELECT id, name FROM $table WHERE id = ?", [$id]);
            if (empty($comment)) {
                response(false, ['message' => '未找到该' . ($type === 'blog' ? '评论' : '留言')]);
            }
            
            // 检查是否有子回复
            $replies = $db->query("SELECT COUNT(*) as cnt FROM $table WHERE parent_id = ?", [$id]);
            $replyCount = $replies[0]['cnt'] ?? 0;
            
            // 开启事务，确保数据一致性
            $db->beginTransaction();
            
            try {
                // 如果有子回复，先删除子回复
                if ($replyCount > 0) {
                    $db->execute("DELETE FROM $table WHERE parent_id = ?", [$id]);
                }
                
                // 删除主留言/评论
                $affected = $db->execute("DELETE FROM $table WHERE id = ?", [$id]);
                
                // 提交事务
                $db->commit();
                
                if ($affected > 0) {
                    $message = $replyCount > 0 
                        ? "删除成功（包括 {$replyCount} 条回复）" 
                        : "删除成功";
                    response(true, [
                        'message' => $message, 
                        'affected' => $affected,
                        'replies_deleted' => $replyCount
                    ]);
                } else {
                    response(false, ['message' => '删除失败']);
                }
            } catch (Exception $e) {
                // 回滚事务
                $db->rollback();
                throw $e;
            }
            
        } catch (Exception $e) {
            response(false, ['message' => '删除失败: ' . $e->getMessage()], 500);
        }
    }
    
    response(false, ['message' => '未知操作']);
}

// GET 请求处理
if ($method === 'GET') {
    checkAuth();
    
    $action = $_GET['action'] ?? '';
    $type = $_GET['type'] ?? 'contact'; // contact = 留言板, blog = 博客评论
    
    // 获取统计数据
    if ($action === 'stats') {
        if ($type === 'blog') {
            // 博客评论统计
            $total = $db->query("SELECT COUNT(*) as cnt FROM blog_comments")[0]['cnt'] ?? 0;
            $pending = $db->query("SELECT COUNT(*) as cnt FROM blog_comments WHERE status = 0")[0]['cnt'] ?? 0;
            $today = $db->query(
                "SELECT COUNT(*) as cnt FROM blog_comments WHERE DATE(created_at) = CURDATE()"
            )[0]['cnt'] ?? 0;
            $likes = $db->query("SELECT SUM(likes) as total FROM blog_comments")[0]['total'] ?? 0;
        } else {
            // 留言板统计
            $total = $db->query("SELECT COUNT(*) as cnt FROM comments")[0]['cnt'] ?? 0;
            $pending = $db->query("SELECT COUNT(*) as cnt FROM comments WHERE status = 0")[0]['cnt'] ?? 0;
            $today = $db->query(
                "SELECT COUNT(*) as cnt FROM comments WHERE DATE(created_at) = CURDATE()"
            )[0]['cnt'] ?? 0;
            $likes = $db->query("SELECT SUM(likes) as total FROM comments")[0]['total'] ?? 0;
        }
        
        response(true, [
            'stats' => [
                'total' => $total,
                'pending' => $pending,
                'today' => $today,
                'likes' => $likes
            ]
        ]);
    }
    
    // 获取留言/评论列表
    if ($action === 'list') {
        $filter = $_GET['filter'] ?? 'all';
        
        $where = '';
        if ($filter === 'active') {
            $where = 'WHERE status = 1';
        } elseif ($filter === 'hidden') {
            $where = 'WHERE status = 0';
        }
        
        if ($type === 'blog') {
            // 博客评论列表，包含文章标题
            // 使用COLLATE解决字符集冲突问题
            $comments = $db->query(
                "SELECT bc.*, bp.title as post_title 
                 FROM blog_comments bc 
                 LEFT JOIN blog_posts bp ON bc.post_slug COLLATE utf8mb4_general_ci = bp.slug 
                 $where 
                 ORDER BY bc.created_at DESC 
                 LIMIT 200"
            );
        } else {
            // 留言板列表
            $comments = $db->query(
                "SELECT * FROM comments $where ORDER BY created_at DESC LIMIT 200"
            );
        }
        
        response(true, ['comments' => $comments]);
    }
    
    response(false, ['message' => '未知操作']);
}

response(false, ['message' => '不支持的请求方法'], 405);
