const { getThemeConfig, saveThemeConfig } = require('../lib/db');
const { verifyToken } = require('../lib/auth');
const { getBearerToken, normalizeMethod, readBody, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const method = normalizeMethod(req);
    const action = req.query.action || 'get';
    const body = method === 'GET' ? {} : await readBody(req);

    if (action === 'get') {
      const data = await getThemeConfig();
      return sendJson(res, 200, { code: 200, data });
    }

    const token = getBearerToken(req);
    if (!verifyToken(token)) {
      return sendJson(res, 401, { code: 401, message: '未授权' });
    }

    const current = await getThemeConfig();

    if (action === 'set') {
      const theme = body.theme || body.key || req.query.theme;
      if (!theme || !current.themes?.[theme]) {
        return sendJson(res, 404, { code: 404, message: '主题不存在' });
      }
      current.current_theme = theme;
      await saveThemeConfig(current);
      return sendJson(res, 200, { code: 200, message: '主题切换成功', data: { theme } });
    }

    if (action === 'update_config') {
      const theme = body.theme;
      const config = body.config;
      if (!theme || !config || !current.themes?.[theme]) {
        return sendJson(res, 400, { code: 400, message: '参数不完整' });
      }
      current.themes[theme].config = config;
      await saveThemeConfig(current);
      return sendJson(res, 200, { code: 200, message: '配置已保存', data: { theme, config } });
    }

    return sendJson(res, 400, { code: 400, message: '无效的操作' });
  } catch (error) {
    return sendJson(res, 500, { code: 500, message: error.message || 'server error' });
  }
};
