function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  const contentType = (req.headers['content-type'] || '').split(';')[0];
  if (contentType === 'application/json') {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return {};
    }
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return '';
  }
  return auth.slice('Bearer '.length).trim();
}

function normalizeMethod(req) {
  return (req.method || 'GET').toUpperCase();
}

module.exports = {
  getBearerToken,
  normalizeMethod,
  readBody,
  sendJson
};
