<?php
/**
 * 博客文章管理 API
 * 提供文章的增删改查、发布、统计等功能
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../class/Database.php';

// 简单的身份验证
session_start();
define('ADMIN_PASSWORD_HASH', '$2y$10$YourHashHere'); // 使用与 admin/api.php 相同的密码

function requireAuth() {
    if (!isset($_SESSION['admin_token']) || $_SESSION['admin_token'] !== 'liueggy_admin_2024') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => '未授权访问']);
        exit;
    }
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
            
            $where = [];
            $params = [];
            
            if ($status !== null) {
                $where[] = 'status = ?';
                $params[] = $status;
            }
            
            if ($category) {
                $where[] = 'category = ?';
                $params[] = $category;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // 获取总数
            $total = $db->fetchOne(
                "SELECT COUNT(*) as count FROM blog_posts $whereClause",
                $params
            )['count'];
            
            // 获取文章列表
            $posts = $db->fetchAll(
                "SELECT id, title, slug, summary, cover_image, category, tags, 
                        status, views, created_at, updated_at, published_at
                 FROM blog_posts 
                 $whereClause
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?",
                array_merge($params, [$limit, $offset])
            );
            
            echo json_encode([
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
            break;
            
        case 'detail':
            // 获取文章详情
            $id = $_GET['id'] ?? '';
            $slug = $_GET['slug'] ?? '';
            
            if ($id) {
                $post = $db->fetchOne(
                    "SELECT * FROM blog_posts WHERE id = ?",
                    [$id]
                );
            } elseif ($slug) {
                $post = $db->fetchOne(
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
            $categories = $db->fetchAll(
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
            
            $stats = [
                'total' => $db->fetchOne("SELECT COUNT(*) as count FROM blog_posts")['count'],
                'published' => $db->fetchOne("SELECT COUNT(*) as count FROM blog_posts WHERE status = 1")['count'],
                'draft' => $db->fetchOne("SELECT COUNT(*) as count FROM blog_posts WHERE status = 0")['count'],
                'total_views' => $db->fetchOne("SELECT SUM(views) as total FROM blog_posts")['total'] ?? 0,
                'categories' => $db->fetchAll("SELECT * FROM blog_categories ORDER BY post_count DESC")
            ];
            
            echo json_encode([
                'success' => true,
                'data' => $stats
            ]);
            break;
            
        default:
            throw new Exception('未知的操作');
    }
}

function handlePost($action, $db) {
    requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'create':
            // 创建新文章
            $id = generateId();
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');
            
            if (empty($title)) {
                throw new Exception('标题不能为空');
            }
            
            if (empty($content)) {
                throw new Exception('内容不能为空');
            }
            
            $slug = $input['slug'] ?? generateSlug($title, $id);
            $summary = trim($input['summary'] ?? '');
            $coverImage = trim($input['cover_image'] ?? '');
            $category = trim($input['category'] ?? '');
            $tags = trim($input['tags'] ?? '');
            $status = isset($input['status']) ? intval($input['status']) : 0;
            
            // 检查slug是否已存在
            $exists = $db->fetchOne(
                "SELECT id FROM blog_posts WHERE slug = ?",
                [$slug]
            );
            
            if ($exists) {
                $slug .= '-' . substr($id, 0, 6);
            }
            
            $publishedAt = $status == 1 ? date('Y-m-d H:i:s') : null;
            
            $result = $db->execute(
                "INSERT INTO blog_posts 
                 (id, title, slug, summary, content, cover_image, category, tags, status, published_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$id, $title, $slug, $summary, $content, $coverImage, $category, $tags, $status, $publishedAt]
            );
            
            // 更新分类计数
            if ($category && $status == 1) {
                $db->execute(
                    "UPDATE blog_categories SET post_count = post_count + 1 WHERE slug = ?",
                    [$category]
                );
            }
            
            echo json_encode([
                'success' => true,
                'message' => '文章创建成功',
                'data' => ['id' => $id, 'slug' => $slug]
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'update':
            // 更新文章
            $id = $input['id'] ?? '';
            
            if (empty($id)) {
                throw new Exception('缺少文章ID');
            }
            
            // 获取原文章信息
            $oldPost = $db->fetchOne(
                "SELECT status, category FROM blog_posts WHERE id = ?",
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
            
            if (isset($input['category'])) {
                $updates[] = 'category = ?';
                $params[] = trim($input['category']);
            }
            
            if (isset($input['tags'])) {
                $updates[] = 'tags = ?';
                $params[] = trim($input['tags']);
            }
            
            if (isset($input['status'])) {
                $newStatus = intval($input['status']);
                $updates[] = 'status = ?';
                $params[] = $newStatus;
                
                // 如果从草稿变为发布，设置发布时间
                if ($oldPost['status'] == 0 && $newStatus == 1) {
                    $updates[] = 'published_at = NOW()';
                    
                    // 更新分类计数
                    if ($oldPost['category']) {
                        $db->execute(
                            "UPDATE blog_categories SET post_count = post_count + 1 WHERE slug = ?",
                            [$oldPost['category']]
                        );
                    }
                }
                // 如果从发布变为草稿，减少分类计数
                elseif ($oldPost['status'] == 1 && $newStatus == 0) {
                    if ($oldPost['category']) {
                        $db->execute(
                            "UPDATE blog_categories SET post_count = post_count - 1 WHERE slug = ?",
                            [$oldPost['category']]
                        );
                    }
                }
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'delete':
            // 删除文章
            $id = $input['id'] ?? '';
            
            if (empty($id)) {
                throw new Exception('缺少文章ID');
            }
            
            // 获取文章信息用于更新分类计数
            $post = $db->fetchOne(
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
