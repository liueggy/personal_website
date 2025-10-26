<?php
/**
 * 博客文章管理 API
 * 提供文章的增删改查、发布、统计等功能
 * 性能优化: 缓存、延迟 session 启动
 */

// 性能优化: 只在需要时启动 session
$needsSession = false;
if (isset($_SERVER['HTTP_AUTHORIZATION']) || isset($_COOKIE['PHPSESSID'])) {
    session_start();
    $needsSession = true;
}

// 输出缓存控制
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/class/Database.php';
// 简单的身份验证
define('ADMIN_PASSWORD_HASH', '$2y$10$YourHashHere'); // 使用与 admin/api.php 相同的密码

// 简单的内存缓存
class SimpleCache {
    private static $cache = [];
    private static $ttl = [];
    
    public static function get($key) {
        if (isset(self::$cache[$key]) && self::$ttl[$key] > time()) {
            return self::$cache[$key];
        }
        return null;
    }
    
    public static function set($key, $value, $seconds = 60) {
        self::$cache[$key] = $value;
        self::$ttl[$key] = time() + $seconds;
    }
    
    public static function delete($key) {
        unset(self::$cache[$key], self::$ttl[$key]);
    }
    
    public static function clear() {
        self::$cache = [];
        self::$ttl = [];
    }
}

function requireAuth() {
    global $needsSession;
    
    // 确保 session 已启动
    if (!$needsSession && session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // 支持两种认证方式: Session 和 Bearer Token
    // 1. 检查 Session
    if (isset($_SESSION['admin_token']) && $_SESSION['admin_token'] === 'liueggy_admin_2024') {
        return true;
    }
    
    // 2. 检查 Bearer Token
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        if ($token === 'liueggy_admin_2024') {
            return true;
        }
    }
    
    // 都不匹配则返回401
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => '未授权访问'
    ]);
    exit;
}

function generateId() {
    return bin2hex(random_bytes(6));
}

function generateSlug($title, $id = '') {
    // 简单的中文转拼音（实际应用中建议使用专业库）
    $slug = preg_replace('/[^\x{4e00}-\x{9fa5}a-zA-Z0-9]+/u', '-', $title);
    $slug = trim($slug, '-');
    $slug = strtolower($slug);
    
    if (empty($slug)) {
        $slug = $id ?: date('YmdHis');
    }
    
    return $slug;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db = Database::getInstance();

try {
    switch ($method) {
        case 'GET':
            handleGet($action, $db);
            break;
        case 'POST':
            handlePost($action, $db);
            break;
        case 'PUT':
            handlePut($action, $db);
            break;
        case 'DELETE':
            handleDelete($action, $db);
            break;
        default:
            throw new Exception('不支持的请求方法');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function handleGet($action, $db) {
    switch ($action) {
        case 'list':
            // 获取文章列表（支持分页和筛选）
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            $status = isset($_GET['status']) ? intval($_GET['status']) : null;
            $category = $_GET['category'] ?? null;
            
            // 缓存键
            $cacheKey = "blog_list_{$page}_{$limit}_{$status}_{$category}";
            $cached = SimpleCache::get($cacheKey);
            if ($cached !== null) {
                // 添加缓存命中头
                header('X-Cache: HIT');
                echo $cached;
                return;
            }
            
            $where = [];
            $params = [];
            
            if ($status !== null) {
                $where[] = 'status = ?';
                $params[] = $status;
            }
            
            // category 字段不存在,暂时注释
            // if ($category) {
            //     $where[] = 'category = ?';
            //     $params[] = $category;
            // }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // 获取总数
            $total = $db->queryOne(
                "SELECT COUNT(*) as count FROM blog_posts $whereClause",
                $params
            )['count'];
            
            // 获取文章列表 - 使用实际存在的字段
            $posts = $db->query(
                "SELECT id, title, slug, summary, cover_image, author,
                        status, view_count, created_at, updated_at
                 FROM blog_posts 
                 $whereClause
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?",
                array_merge($params, [$limit, $offset])
            );
            
            $response = json_encode([
                'success' => true,
                'data' => [
                    'posts' => $posts,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'limit' => $limit,
                        'pages' => ceil($total / $limit)
                    ]
                ]
            ]);
            
            // 缓存 5 分钟
            SimpleCache::set($cacheKey, $response, 300);
            header('X-Cache: MISS');
            echo $response;
            break;
            
        case 'detail':
            // 获取文章详情
            $id = $_GET['id'] ?? '';
            $slug = $_GET['slug'] ?? '';
            
            if ($id) {
                $post = $db->queryOne(
                    "SELECT * FROM blog_posts WHERE id = ?",
                    [$id]
                );
            } elseif ($slug) {
                $post = $db->queryOne(
                    "SELECT * FROM blog_posts WHERE slug = ?",
                    [$slug]
                );
            } else {
                throw new Exception('缺少文章ID或slug');
            }
            
            if (!$post) {
                throw new Exception('文章不存在');
            }
            
            // 增加浏览次数（仅已发布的文章）
            if ($post['status'] == 1 && !isset($_SESSION['admin_token'])) {
                $db->execute(
                    "UPDATE blog_posts SET views = views + 1 WHERE id = ?",
                    [$post['id']]
                );
                $post['views']++;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $post
            ]);
            break;
            
        case 'categories':
            // 获取所有分类
            $categories = $db->query(
                "SELECT * FROM blog_categories ORDER BY name ASC"
            );
            
            echo json_encode([
                'success' => true,
                'data' => $categories
            ]);
            break;
            
        case 'stats':
            // 获取统计信息（需要管理员权限）
            requireAuth();
            
            // 缓存键
            $cacheKey = "blog_stats";
            $cached = SimpleCache::get($cacheKey);
            if ($cached !== null) {
                header('X-Cache: HIT');
                echo $cached;
                return;
            }
            
            $stats = [
                'total' => (int)$db->queryOne("SELECT COUNT(*) as count FROM blog_posts")['count'],
                'published' => (int)$db->queryOne("SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'")['count'],
                'draft' => (int)$db->queryOne("SELECT COUNT(*) as count FROM blog_posts WHERE status = 'draft'")['count'],
                'total_views' => (int)($db->queryOne("SELECT SUM(view_count) as total FROM blog_posts")['total'] ?? 0),
                'categories' => []  // 暂时返回空数组，因为还没有分类表
            ];
            
            $response = json_encode([
                'success' => true,
                'data' => $stats
            ]);
            
            // 缓存 1 分钟
            SimpleCache::set($cacheKey, $response, 60);
            header('X-Cache: MISS');
            echo $response;
            break;
            
        default:
            throw new Exception('未知的操作');
    }
}

function handlePost($action, $db) {
    requireAuth();
    
    // 清除缓存
    SimpleCache::clear();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'create':
            // 创建新文章
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');
            
            if (empty($title)) {
                throw new Exception('标题不能为空');
            }
            
            if (empty($content)) {
                throw new Exception('内容不能为空');
            }
            
            // 先生成一个临时 slug,如果用户没提供
            $slug = $input['slug'] ?? generateSlug($title);
            if (empty($slug)) {
                $slug = 'post-' . time();
            }
            
            $summary = trim($input['summary'] ?? '');
            $coverImage = trim($input['cover_image'] ?? '');
            $author = trim($input['author'] ?? 'LiuEggy');
            // status 是 enum: 'draft' 或 'published'
            $status = (isset($input['status']) && $input['status'] == 1) ? 'published' : 'draft';
            
            // 检查slug是否已存在
            $exists = $db->queryOne(
                "SELECT id FROM blog_posts WHERE slug = ?",
                [$slug]
            );
            
            if ($exists) {
                $slug .= '-' . time();
            }
            
            // 不指定 id,让数据库自动生成
            $result = $db->execute(
                "INSERT INTO blog_posts 
                 (title, slug, summary, content, cover_image, author, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$title, $slug, $summary, $content, $coverImage, $author, $status]
            );
            
            // 获取新插入的 id
            $newId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => '文章创建成功',
                'data' => ['id' => $newId, 'slug' => $slug]
            ]);
            break;
            
        case 'category':
            // 创建新分类
            $name = trim($input['name'] ?? '');
            $slug = $input['slug'] ?? generateSlug($name);
            $description = trim($input['description'] ?? '');
            
            if (empty($name)) {
                throw new Exception('分类名称不能为空');
            }
            
            $result = $db->execute(
                "INSERT INTO blog_categories (name, slug, description) VALUES (?, ?, ?)",
                [$name, $slug, $description]
            );
            
            echo json_encode([
                'success' => true,
                'message' => '分类创建成功'
            ]);
            break;
            
        default:
            throw new Exception('未知的操作');
    }
}

function handlePut($action, $db) {
    requireAuth();
    
    // 清除缓存
    SimpleCache::clear();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'update':
            // 更新文章
            $id = $input['id'] ?? '';
            
            if (empty($id)) {
                throw new Exception('缺少文章ID');
            }
            
            // 获取原文章信息
            $oldPost = $db->queryOne(
                "SELECT status FROM blog_posts WHERE id = ?",
                [$id]
            );
            
            if (!$oldPost) {
                throw new Exception('文章不存在');
            }
            
            $updates = [];
            $params = [];
            
            if (isset($input['title'])) {
                $updates[] = 'title = ?';
                $params[] = trim($input['title']);
            }
            
            if (isset($input['slug'])) {
                $updates[] = 'slug = ?';
                $params[] = trim($input['slug']);
            }
            
            if (isset($input['summary'])) {
                $updates[] = 'summary = ?';
                $params[] = trim($input['summary']);
            }
            
            if (isset($input['content'])) {
                $updates[] = 'content = ?';
                $params[] = trim($input['content']);
            }
            
            if (isset($input['cover_image'])) {
                $updates[] = 'cover_image = ?';
                $params[] = trim($input['cover_image']);
            }
            
            if (isset($input['author'])) {
                $updates[] = 'author = ?';
                $params[] = trim($input['author']);
            }
            
            if (isset($input['status'])) {
                // status 是 enum: 'draft' 或 'published'
                $newStatus = ($input['status'] == 1 || $input['status'] === 'published') ? 'published' : 'draft';
                $updates[] = 'status = ?';
                $params[] = $newStatus;
            }
            
            if (empty($updates)) {
                throw new Exception('没有要更新的字段');
            }
            
            $params[] = $id;
            
            $result = $db->execute(
                "UPDATE blog_posts SET " . implode(', ', $updates) . " WHERE id = ?",
                $params
            );
            
            echo json_encode([
                'success' => true,
                'message' => '文章更新成功'
            ]);
            break;
            
        default:
            throw new Exception('未知的操作');
    }
}

function handleDelete($action, $db) {
    requireAuth();
    
    // 清除缓存
    SimpleCache::clear();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'delete':
            // 删除文章
            $id = $input['id'] ?? '';
            
            if (empty($id)) {
                throw new Exception('缺少文章ID');
            }
            
            // 获取文章信息用于更新分类计数
            $post = $db->queryOne(
                "SELECT status, category FROM blog_posts WHERE id = ?",
                [$id]
            );
            
            if (!$post) {
                throw new Exception('文章不存在');
            }
            
            $result = $db->execute(
                "DELETE FROM blog_posts WHERE id = ?",
                [$id]
            );
            
            // 更新分类计数
            if ($post['status'] == 1 && $post['category']) {
                $db->execute(
                    "UPDATE blog_categories SET post_count = post_count - 1 WHERE slug = ?",
                    [$post['category']]
                );
            }
            
            echo json_encode([
                'success' => true,
                'message' => '文章删除成功'
            ]);
            break;
            
        default:
            throw new Exception('未知的操作');
    }
}
