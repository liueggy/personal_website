const { createBlogCommentWithMeta, likeBlogComment, listBlogComments } = require('../lib/db');
const { normalizeMethod, readBody, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const method = normalizeMethod(req);
    const body = method === 'GET' ? {} : await readBody(req);
    const action = req.query.action || body.action || 'list';

    if (action === 'list') {
      const postId = req.query.post_id || body.post_id;
      if (!postId) {
        return sendJson(res, 400, { code: 400, message: '文章ID不能为空' });
      }
      const comments = await listBlogComments(postId);
      const countAll = (items) => items.reduce((total, item) => total + 1 + countAll(item.replies || []), 0);
      return sendJson(res, 200, {
        code: 200,
        message: '获取成功',
        data: {
          total: countAll(comments),
          comments
        }
      });
    }

    if (action === 'create' && method === 'POST') {
      const id = await createBlogCommentWithMeta(body, {
        forwardedFor: req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || ''
      });
      return sendJson(res, 200, { code: 200, message: '评论成功', data: { id } });
    }

    if (action === 'react' && method === 'POST') {
      const commentId = body.comment_id;
      if (!commentId) {
        return sendJson(res, 400, { code: 400, message: '评论ID不能为空' });
      }
      const likes = await likeBlogComment(Number(commentId));
      return sendJson(res, 200, { code: 200, message: '操作成功', data: { likes } });
    }

    return sendJson(res, 400, { code: 400, message: '无效的操作' });
  } catch (error) {
    return sendJson(res, 400, { code: 400, message: error.message || '操作失败' });
  }
};
