<?php
/**
 * 博客文章数据模型
 */
class BlogModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * 获取文章列表
     */
    public function getList($page = 1, $pageSize = 10, $status = 'published') {
        $offset = ($page - 1) * $pageSize;
        
        $sql = "SELECT id, title, slug, summary, author, cover_image, 
                       view_count, created_at, updated_at 
                FROM blog_posts 
                WHERE status = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?";
        
        $posts = $this->db->query($sql, [$status, $pageSize, $offset]);
        
        // 获取总数
        $countSql = "SELECT COUNT(*) as total FROM blog_posts WHERE status = ?";
        $countResult = $this->db->query($countSql, [$status]);
        $total = $countResult[0]['total'] ?? 0;
        
        return [
            'posts' => $posts,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => ceil($total / $pageSize)
        ];
    }
    
    /**
     * 根据ID获取文章
     */
    public function getById($id) {
        $sql = "SELECT * FROM blog_posts WHERE id = ?";
        $posts = $this->db->query($sql, [$id]);
        
        if (!empty($posts)) {
            // 增加浏览量
            $this->incrementViewCount($id);
            return $posts[0];
        }
        
        return null;
    }
    
    /**
     * 根据slug获取文章
     */
    public function getBySlug($slug) {
        $sql = "SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'";
        $posts = $this->db->query($sql, [$slug]);
        
        if (!empty($posts)) {
            // 增加浏览量
            $this->incrementViewCount($posts[0]['id']);
            return $posts[0];
        }
        
        return null;
    }
    
    /**
     * 创建文章
     */
    public function create($data) {
        $sql = "INSERT INTO blog_posts (title, slug, content, summary, author, 
                cover_image, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        return $this->db->execute($sql, [
            $data['title'],
            $data['slug'],
            $data['content'],
            $data['summary'],
            $data['author'],
            $data['cover_image'] ?? null,
            $data['status'] ?? 'draft'
        ]);
    }
    
    /**
     * 更新文章
     */
    public function update($id, $data) {
        $sql = "UPDATE blog_posts 
                SET title = ?, slug = ?, content = ?, summary = ?, 
                    author = ?, cover_image = ?, status = ?, updated_at = NOW() 
                WHERE id = ?";
        
        return $this->db->execute($sql, [
            $data['title'],
            $data['slug'],
            $data['content'],
            $data['summary'],
            $data['author'],
            $data['cover_image'] ?? null,
            $data['status'] ?? 'draft',
            $id
        ]);
    }
    
    /**
     * 删除文章
     */
    public function delete($id) {
        $sql = "DELETE FROM blog_posts WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
    
    /**
     * 增加浏览量
     */
    private function incrementViewCount($id) {
        $sql = "UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?";
        $this->db->execute($sql, [$id]);
    }
    
    /**
     * 检查slug是否已存在
     */
    public function slugExists($slug, $excludeId = null) {
        if ($excludeId) {
            $sql = "SELECT COUNT(*) as count FROM blog_posts WHERE slug = ? AND id != ?";
            $result = $this->db->query($sql, [$slug, $excludeId]);
        } else {
            $sql = "SELECT COUNT(*) as count FROM blog_posts WHERE slug = ?";
            $result = $this->db->query($sql, [$slug]);
        }
        
        return ($result[0]['count'] ?? 0) > 0;
    }
    
    /**
     * 获取统计信息
     */
    public function getStats() {
        $stats = [];
        
        // 文章总数
        $sql = "SELECT COUNT(*) as total FROM blog_posts WHERE status = 'published'";
        $result = $this->db->query($sql);
        $stats['total_posts'] = $result[0]['total'] ?? 0;
        
        // 草稿数
        $sql = "SELECT COUNT(*) as total FROM blog_posts WHERE status = 'draft'";
        $result = $this->db->query($sql);
        $stats['draft_posts'] = $result[0]['total'] ?? 0;
        
        // 总浏览量
        $sql = "SELECT SUM(view_count) as total FROM blog_posts";
        $result = $this->db->query($sql);
        $stats['total_views'] = $result[0]['total'] ?? 0;
        
        // 留言总数（从 comments 表统计，status=1表示已审核通过）
        $sql = "SELECT COUNT(*) as total FROM comments WHERE status = 1";
        $result = $this->db->query($sql);
        $stats['total_messages'] = $result[0]['total'] ?? 0;
        
        return $stats;
    }

    // ========== 评论（文章）相关 ==========
    private function ensureBlogCommentsTable() {
        // 创建表（如果不存在），存储基于文章slug的评论
        $sql = "CREATE TABLE IF NOT EXISTS blog_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_slug VARCHAR(255) NOT NULL,
            parent_id INT NULL,
            name VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            likes INT NOT NULL DEFAULT 0,
            status TINYINT NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_post_slug (post_slug),
            INDEX idx_parent (parent_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $this->db->execute($sql);
    }

    public function getCommentsByPostId($slug) {
        $this->ensureBlogCommentsTable();
        $rows = $this->db->query(
            "SELECT id, post_slug, parent_id, name, content, likes, status, created_at 
             FROM blog_comments 
             WHERE post_slug = ? AND status = 1 
             ORDER BY created_at ASC, id ASC",
            [$slug]
        );

        // 构建树形结构
        $map = [];
        foreach ($rows as $r) {
            $r['replies'] = [];
            $map[$r['id']] = $r;
        }
        $tree = [];
        foreach ($map as $id => &$node) {
            if (!empty($node['parent_id'])) {
                if (isset($map[$node['parent_id']])) {
                    $map[$node['parent_id']]['replies'][] = &$node;
                } else {
                    $tree[] = &$node; // 父级不存在时，作为根节点
                }
            } else {
                $tree[] = &$node;
            }
        }
        // 清理引用
        unset($node);
        return $tree;
    }

    public function createComment($data) {
        $this->ensureBlogCommentsTable();
        $sql = "INSERT INTO blog_comments (post_slug, parent_id, name, content, status, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())";
        $this->db->execute($sql, [
            $data['post_id'], // 实际使用slug
            $data['parent_id'] ?? null,
            $data['name'],
            $data['content'],
            $data['status'] ?? 1,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function reactToComment($commentId, $type = 'like') {
        $this->ensureBlogCommentsTable();
        if ($type !== 'like') $type = 'like';
        $this->db->execute("UPDATE blog_comments SET likes = likes + 1 WHERE id = ?", [$commentId]);
        $row = $this->db->queryOne("SELECT likes FROM blog_comments WHERE id = ?", [$commentId]);
        return ['likes' => (int)($row['likes'] ?? 0)];
    }
}
