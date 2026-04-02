const { getSiteStats, trackSiteVisit } = require('../lib/db');
const { normalizeMethod, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const action = req.query.action || 'track';
    const method = normalizeMethod(req);

    if (method !== 'GET') {
      return sendJson(res, 405, { code: 405, message: 'Method not allowed' });
    }

    if (action === 'track') {
      const source = [
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
        req.headers['user-agent'] || ''
      ].join('|');
      const data = await trackSiteVisit(source);
      return sendJson(res, 200, { code: 200, data });
    }

    if (action === 'stats') {
      const data = await getSiteStats();
      return sendJson(res, 200, { code: 200, data });
    }

    return sendJson(res, 400, { code: 400, message: 'invalid action' });
  } catch (error) {
    return sendJson(res, 500, { code: 500, message: error.message || 'server error' });
  }
};
