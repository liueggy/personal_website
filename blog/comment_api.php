<?php
// 评论API - 简化版本，支持匿名评论和回复
header('Content-Type: application/json; charset=utf-8');

// 设置中国时区
date_default_timezone_set('Asia/Shanghai');

require_once __DIR__ . '/../class/Database.php';
require_once __DIR__ . '/../class/BlogModel.php';

$blogModel = new BlogModel();
$action = $_GET['action'] ?? '';

// 获取POST数据
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch($action) {
        case 'list':
            // 获取评论列表
            $postId = $_GET['post_id'] ?? '';
            if (empty($postId)) {
                throw new Exception('文章ID不能为空');
            }
            
            $comments = $blogModel->getCommentsByPostId($postId);
            $total = count($comments);
            
            echo json_encode([
                'code' => 200,
                'message' => '获取成功',
                'data' => [
                    'total' => $total,
                    'comments' => $comments
                ]
            ], JSON_UNESCAPED_UNICODE);
            break;
            
        case 'create':
            // 创建评论
            $postId = $input['post_id'] ?? '';
            $name = trim($input['name'] ?? '匿名用户');
            $content = trim($input['content'] ?? '');
            $parentId = $input['parent_id'] ?? null;
            
            if (empty($postId)) {
                throw new Exception('文章ID不能为空');
            }
            
            if (empty($content)) {
                throw new Exception('评论内容不能为空');
            }
            
            if (mb_strlen($content) > 500) {
                throw new Exception('评论内容不能超过500字');
            }
            
            if (mb_strlen($name) > 20) {
                throw new Exception('昵称不能超过20字');
            }
            
            // 默认匿名用户
            if (empty($name)) {
                $name = '匿名用户';
            }
            
            // 插入评论
            $commentId = $blogModel->createComment([
                'post_id' => $postId,
                'name' => $name,
                'content' => $content,
                'parent_id' => $parentId,
                'status' => 1 // 直接通过审核
            ]);
            
            if ($commentId) {
                echo json_encode([
                    'code' => 200,
                    'message' => '评论成功',
                    'data' => ['id' => $commentId]
                ], JSON_UNESCAPED_UNICODE);
            } else {
                throw new Exception('评论失败');
            }
            break;
            
        case 'react':
            // 点赞
            $commentId = $input['comment_id'] ?? '';
            $type = $input['type'] ?? 'like';
            
            if (empty($commentId)) {
                throw new Exception('评论ID不能为空');
            }
            
            $result = $blogModel->reactToComment($commentId, $type);
            
            echo json_encode([
                'code' => 200,
                'message' => '操作成功',
                'data' => $result
            ], JSON_UNESCAPED_UNICODE);
            break;
            
        default:
            throw new Exception('无效的操作');
    }
} catch (Exception $e) {
    echo json_encode([
        'code' => 400,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
