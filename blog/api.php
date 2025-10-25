<?php
/**
 * 博客管理API
 * 提供文章的增删改查功能
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

// 引入数据库类
require_once '../class/Database.php';
require_once '../class/BlogModel.php';

// 管理员认证
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', password_hash('666666qaz', PASSWORD_BCRYPT));

// 获取请求方法和动作
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ---- Image cache config for Scheme B ----
const IMG_MAX_BYTES = 5242880; // 5MB
const IMG_TIMEOUT = 8; // seconds
$IMG_ALLOWED_TYPES = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/pjpeg'=> 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

/**
 * 缓存封面图到本地并返回相对URL（/uploads/covers/yyyymm/hash.ext）
 * 如果失败，返回原始URL
 */
function cacheCoverImageIfExternal($url) {
    global $IMG_ALLOWED_TYPES;
    $url = trim((string)$url);
    if ($url === '') return '';
    if (!preg_match('#^https?://#i', $url)) {
        // 非外链（本地/相对路径）直接返回
        return $url;
    }

    // 目录与文件名
    $uploadBase = realpath(__DIR__ . '/../') . '/uploads/covers';
    if (!is_dir($uploadBase)) @mkdir($uploadBase, 0755, true);
    $ym = date('Ym');
    $dir = $uploadBase . '/' . $ym;
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $hash = sha1($url);

    // 下载图片
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => IMG_TIMEOUT,
        CURLOPT_TIMEOUT => IMG_TIMEOUT,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (BlogAPI Cache) LiuEggySite/1.0',
        CURLOPT_REFERER => '',
        CURLOPT_HEADER => true,
    ]);

    $downloaded = 0;
    curl_setopt($ch, CURLOPT_NOPROGRESS, false);
    curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, function($resource, $dltotal, $dlnow) use (&$downloaded) {
        $downloaded = $dlnow;
        return ($dlnow > IMG_MAX_BYTES) ? 1 : 0;
    });

    $resp = curl_exec($ch);
    if ($resp === false) {
        curl_close($ch);
        return $url; // 回退为原始URL
    }
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $body = substr($resp, $headerSize);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $ctype = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($code < 200 || $code >= 300) return $url;
    $ctype = $ctype ? strtolower(trim(explode(';', $ctype)[0])) : '';
    if (!$ctype || !isset($IMG_ALLOWED_TYPES[$ctype])) return $url;
    if ($body === '' || $body === false) return $url;

    $ext = $IMG_ALLOWED_TYPES[$ctype];
    $filePath = "$dir/$hash.$ext";
    if (!file_exists($filePath) || filesize($filePath) === 0) {
        @file_put_contents($filePath, $body);
    }
    if (!file_exists($filePath)) return $url;

    // 返回相对URL
    return "/uploads/covers/$ym/$hash.$ext";
}

// 路由处理
try {
    switch($action) {
        case 'login':
            handleLogin();
            break;
            
        case 'logout':
            handleLogout();
            break;
            
        case 'check':
            checkAuth();
            break;
            
        case 'list':
            // 允许公开获取已发布文章（status=published），管理后台获取全部文章需认证
            $requestedStatus = $_GET['status'] ?? 'published';
            if ($requestedStatus === 'all' || $requestedStatus === 'draft') {
                requireAuth();
            }
            getPostsList();
            break;
            
        case 'get':
            getPost();
            break;
            
        case 'create':
            requireAuth();
            createPost();
            break;
            
        case 'update':
            requireAuth();
            updatePost();
            break;
            
        case 'delete':
            requireAuth();
            deletePost();
            break;
            
        case 'stats':
            // 公开统计数据，无需认证
            getStats();
            break;
        
        case 'migrate_covers':
            // 一次性任务：将外链封面缓存为本地并回写数据库
            requireAuth();
            migrateCovers();
            break;
            
        default:
            response(400, '无效的操作');
    }
} catch (Exception $e) {
    response(500, '服务器错误: ' . $e->getMessage());
}

/**
 * 登录处理
 */
function handleLogin() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        response(400, '用户名和密码不能为空');
    }
    
    if ($input['username'] === ADMIN_USERNAME && 
        password_verify($input['password'], ADMIN_PASSWORD)) {
        
        $_SESSION['blog_admin'] = true;
        $_SESSION['blog_admin_time'] = time();
        
        response(200, '登录成功', [
            'token' => session_id()
        ]);
    } else {
        response(401, '用户名或密码错误');
    }
}

/**
 * 登出处理
 */
function handleLogout() {
    unset($_SESSION['blog_admin']);
    unset($_SESSION['blog_admin_time']);
    response(200, '已退出登录');
}

/**
 * 检查登录状态
 */
function checkAuth() {
    if (isset($_SESSION['blog_admin']) && $_SESSION['blog_admin'] === true) {
        response(200, '已登录', ['logged_in' => true]);
    } else {
        response(401, '未登录', ['logged_in' => false]);
    }
}

/**
 * 要求登录
 */
function requireAuth() {
    if (!isset($_SESSION['blog_admin']) || $_SESSION['blog_admin'] !== true) {
        response(401, '请先登录');
    }
    
    // 检查会话超时 (2小时)
    if (time() - ($_SESSION['blog_admin_time'] ?? 0) > 7200) {
        unset($_SESSION['blog_admin']);
        response(401, '会话已过期，请重新登录');
    }
    
    // 更新最后活动时间
    $_SESSION['blog_admin_time'] = time();
}

/**
 * 获取文章列表
 */
function getPostsList() {
    $page = intval($_GET['page'] ?? 1);
    $pageSize = intval($_GET['pageSize'] ?? 10);
    $status = $_GET['status'] ?? 'all';
    
    $blogModel = new BlogModel();
    
    if ($status === 'all') {
        // 管理后台显示所有文章
        $offset = ($page - 1) * $pageSize;
        $sql = "SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $posts = Database::getInstance()->query($sql, [$pageSize, $offset]);
        
        $countSql = "SELECT COUNT(*) as total FROM blog_posts";
        $countResult = Database::getInstance()->query($countSql);
        $total = $countResult[0]['total'] ?? 0;
        
        response(200, '获取成功', [
            'posts' => $posts,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize)
        ]);
    } else {
        $result = $blogModel->getList($page, $pageSize, $status);
        response(200, '获取成功', $result);
    }
}

/**
 * 获取单篇文章
 */
function getPost() {
    $id = $_GET['id'] ?? '';
    $slug = $_GET['slug'] ?? '';
    
    $blogModel = new BlogModel();
    
    if ($id) {
        $post = $blogModel->getById($id);
    } elseif ($slug) {
        $post = $blogModel->getBySlug($slug);
    } else {
        response(400, '请提供文章ID或slug');
    }
    
    if ($post) {
        response(200, '获取成功', $post);
    } else {
        response(404, '文章不存在');
    }
}

/**
 * 创建文章
 */
function createPost() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 验证必填字段
    if (empty($input['title'])) {
        response(400, '标题不能为空');
    }
    
    if (empty($input['content'])) {
        response(400, '内容不能为空');
    }
    
    // 生成slug
    if (empty($input['slug'])) {
        $input['slug'] = generateSlug($input['title']);
    } else {
        $input['slug'] = sanitizeSlug($input['slug']);
    }
    
    // 检查slug是否已存在
    $blogModel = new BlogModel();
    if ($blogModel->slugExists($input['slug'])) {
        $input['slug'] .= '-' . time();
    }
    
    // 生成摘要
    if (empty($input['summary'])) {
        $input['summary'] = generateSummary($input['content']);
    }
    
    // 设置作者
    if (empty($input['author'])) {
        $input['author'] = 'LiuEggy';
    }
    
    // 创建文章
    // 封面：若是外链，保存为本地缓存路径
    if (!empty($input['cover_image'])) {
        $input['cover_image'] = cacheCoverImageIfExternal($input['cover_image']);
    }

    $result = $blogModel->create($input);
    
    if ($result > 0) {
        response(200, '文章创建成功', ['slug' => $input['slug']]);
    } else {
        response(500, '文章创建失败');
    }
}

/**
 * 更新文章
 */
function updatePost() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        response(400, '文章ID不能为空');
    }
    
    if (empty($input['title'])) {
        response(400, '标题不能为空');
    }
    
    if (empty($input['content'])) {
        response(400, '内容不能为空');
    }
    
    // 处理slug
    if (empty($input['slug'])) {
        $input['slug'] = generateSlug($input['title']);
    } else {
        $input['slug'] = sanitizeSlug($input['slug']);
    }
    
    // 检查slug冲突
    $blogModel = new BlogModel();
    if ($blogModel->slugExists($input['slug'], $input['id'])) {
        response(400, 'URL别名已被使用，请使用其他别名');
    }
    
    // 强制重新生成摘要，确保摘要与最新内容一致
    $input['summary'] = generateSummary($input['content']);
    
    // 封面：若是外链，保存为本地缓存路径
    if (!empty($input['cover_image'])) {
        $input['cover_image'] = cacheCoverImageIfExternal($input['cover_image']);
    }

    $result = $blogModel->update($input['id'], $input);
    
    if ($result > 0) {
        response(200, '文章更新成功');
    } else {
        response(500, '文章更新失败');
    }
}

/**
 * 删除文章
 */
function deletePost() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        response(400, '文章ID不能为空');
    }
    
    $blogModel = new BlogModel();
    $result = $blogModel->delete($input['id']);
    
    if ($result > 0) {
        response(200, '文章删除成功');
    } else {
        response(500, '文章删除失败');
    }
}

/**
 * 获取统计信息
 */
function getStats() {
    $blogModel = new BlogModel();
    $stats = $blogModel->getStats();
    response(200, '获取成功', $stats);
}

/**
 * 迁移外链封面为本地缓存并更新数据库
 */
function migrateCovers() {
    $db = Database::getInstance();
    $rows = $db->query("SELECT id, cover_image FROM blog_posts WHERE cover_image IS NOT NULL AND cover_image != ''");
    $updated = 0; $skipped = 0; $failed = 0;
    foreach ($rows as $row) {
        $id = (int)$row['id'];
        $old = trim($row['cover_image']);
        if ($old === '' || !preg_match('#^https?://#i', $old)) { $skipped++; continue; }
        $new = cacheCoverImageIfExternal($old);
        if ($new && $new !== $old) {
            $ok = $db->execute("UPDATE blog_posts SET cover_image = ?, updated_at = NOW() WHERE id = ?", [$new, $id]);
            if ($ok) $updated++; else $failed++;
        } else {
            $skipped++;
        }
    }
    response(200, '迁移完成', [ 'updated' => $updated, 'skipped' => $skipped, 'failed' => $failed ]);
}

/**
 * 生成URL别名
 */
function generateSlug($title) {
    // 使用拼音或时间戳
    return 'post-' . time();
}

/**
 * 清理URL别名
 */
function sanitizeSlug($slug) {
    // 只保留字母、数字、连字符
    $slug = preg_replace('/[^a-zA-Z0-9\-_]/', '', $slug);
    $slug = strtolower($slug);
    return $slug;
}

/**
 * 生成文章摘要
 */
function generateSummary($content, $length = 200) {
    // 去除HTML标签
    $text = strip_tags($content);
    // 去除多余空白
    $text = preg_replace('/\s+/', ' ', $text);
    // 截取指定长度
    if (mb_strlen($text) > $length) {
        $text = mb_substr($text, 0, $length) . '...';
    }
    return trim($text);
}

/**
 * 统一响应格式
 */
function response($code, $message, $data = null) {
    http_response_code($code);
    echo json_encode([
        'code' => $code,
        'message' => $message,
        'data' => $data,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
