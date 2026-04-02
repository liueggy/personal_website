const { createAdminToken, validateAdminCredentials, verifyToken } = require('../lib/auth');
const {
  deleteModerationItem,
  getModerationStats,
  listModerationItems,
  updateModerationStatus
} = require('../lib/db');
const { getBearerToken, normalizeMethod, readBody, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const method = normalizeMethod(req);
    const body = method === 'GET' ? {} : await readBody(req);
    const action = req.query.action || body.action || '';

    if (action === 'login' && method === 'POST') {
      const username = body.username || '';
      const password = body.password || '';
      if (!validateAdminCredentials(username, password)) {
        return sendJson(res, 401, { ok: false, message: '用户名或密码错误' });
      }
      const token = createAdminToken(username);
      return sendJson(res, 200, { ok: true, token });
    }

    const payload = verifyToken(getBearerToken(req));
    if (!payload) {
      return sendJson(res, 401, { ok: false, message: '未授权' });
    }

    if (action === 'stats') {
      const type = req.query.type === 'blog' ? 'blog' : 'contact';
      const stats = await getModerationStats(type);
      return sendJson(res, 200, { ok: true, stats });
    }

    if (action === 'list') {
      const type = req.query.type === 'blog' ? 'blog' : 'contact';
      const filter = req.query.filter || 'all';
      const comments = await listModerationItems(type, filter);
      return sendJson(res, 200, { ok: true, comments });
    }

    if (action === 'toggle' && method === 'POST') {
      await updateModerationStatus(body.type === 'blog' ? 'blog' : 'contact', body.id, Number(body.status || 0));
      return sendJson(res, 200, { ok: true, message: '状态已更新' });
    }

    if (action === 'delete' && method === 'POST') {
      await deleteModerationItem(body.type === 'blog' ? 'blog' : 'contact', body.id);
      return sendJson(res, 200, { ok: true, message: '已删除' });
    }

    return sendJson(res, 400, { ok: false, message: '无效的操作' });
  } catch (error) {
    return sendJson(res, 500, { ok: false, message: error.message || '服务器错误' });
  }
};
