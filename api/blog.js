const {
  deletePost,
  getPostById,
  getPostBySlug,
  getPostStats,
  incrementPostViews,
  listCategories,
  listPosts,
  normalizeStatus,
  upsertPost
} = require('../lib/db');
const { verifyToken } = require('../lib/auth');
const { getBearerToken, normalizeMethod, readBody, sendJson } = require('../lib/http');

function isAuthed(req) {
  return Boolean(verifyToken(getBearerToken(req)));
}

module.exports = async function handler(req, res) {
  try {
    const method = normalizeMethod(req);
    const body = method === 'GET' ? {} : await readBody(req);
    const action = req.query.action || body.action || '';
    const authed = isAuthed(req);

    if (action === 'stats') {
      const stats = await getPostStats();
      return sendJson(res, 200, {
        code: 200,
        success: true,
        data: {
          total: stats.total_posts,
          published: stats.published_posts,
          draft: stats.draft_posts,
          total_views: stats.total_views,
          total_posts: stats.total_posts,
          total_messages: stats.total_messages
        }
      });
    }

    if (action === 'categories') {
      const data = await listCategories();
      return sendJson(res, 200, { success: true, code: 200, data });
    }

    if (action === 'list') {
      const rawStatus = req.query.status || 'published';
      const requestedStatus = rawStatus === '1'
        ? 'published'
        : rawStatus === '0'
          ? 'draft'
          : rawStatus;
      const status = authed && (requestedStatus === 'all' || requestedStatus === 'draft')
        ? requestedStatus === 'draft' ? 'draft' : 'all'
        : requestedStatus === 'draft' ? 'published' : requestedStatus;

      const data = await listPosts({
        page: req.query.page,
        pageSize: req.query.pageSize,
        limit: req.query.limit,
        status,
        category: req.query.category
      });

      return sendJson(res, 200, {
        code: 200,
        success: true,
        message: '获取成功',
        data: {
          posts: data.posts,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
          totalPages: data.totalPages,
          pagination: {
            page: data.page,
            pageSize: data.pageSize,
            pages: data.totalPages,
            total: data.total
          }
        }
      });
    }

    if (action === 'get') {
      const slug = req.query.slug;
      if (!slug) {
        return sendJson(res, 400, { code: 400, message: '缺少 slug' });
      }
      const post = await getPostBySlug(slug, authed);
      if (!post) {
        return sendJson(res, 404, { code: 404, message: '文章不存在' });
      }
      if (post.status === 'published') {
        await incrementPostViews(slug);
        post.view_count += 1;
      }
      return sendJson(res, 200, { code: 200, success: true, data: post });
    }

    if (action === 'detail') {
      if (!authed) {
        return sendJson(res, 401, { success: false, message: '请先登录' });
      }
      const post = await getPostById(Number(req.query.id || body.id));
      if (!post) {
        return sendJson(res, 404, { success: false, message: '文章不存在' });
      }
      return sendJson(res, 200, { success: true, code: 200, data: post });
    }

    if (!authed) {
      return sendJson(res, 401, { success: false, code: 401, message: '请先登录' });
    }

    if (action === 'create' && method === 'POST') {
      const post = await upsertPost({ ...body, status: normalizeStatus(body.status) });
      return sendJson(res, 200, { success: true, code: 200, message: '创建成功', data: post });
    }

    if (action === 'update' && (method === 'PUT' || method === 'POST')) {
      const id = Number(body.id || req.query.id);
      const post = await upsertPost({ ...body, status: normalizeStatus(body.status) }, id);
      return sendJson(res, 200, { success: true, code: 200, message: '更新成功', data: post });
    }

    if (action === 'delete' && (method === 'DELETE' || method === 'POST')) {
      const id = Number(body.id || req.query.id);
      await deletePost(id);
      return sendJson(res, 200, { success: true, code: 200, message: '删除成功' });
    }

    return sendJson(res, 400, { success: false, code: 400, message: '无效的操作' });
  } catch (error) {
    return sendJson(res, 500, { success: false, code: 500, message: error.message || '服务器错误' });
  }
};
