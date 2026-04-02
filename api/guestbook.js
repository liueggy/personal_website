const crypto = require('crypto');
const { createGuestbookComment, likeGuestbookComment, listGuestbookComments } = require('../lib/db');
const { normalizeMethod, readBody, sendJson } = require('../lib/http');

function getChallengeSecret() {
  return process.env.CHALLENGE_SECRET || process.env.ADMIN_TOKEN_SECRET || 'guestbook-challenge-secret';
}

function signChallenge(answer, expiresAt) {
  const payload = `${answer}:${expiresAt}`;
  return crypto.createHmac('sha256', getChallengeSecret()).update(payload).digest('base64url');
}

function makeChallenge() {
  const left = Math.floor(Math.random() * 8) + 1;
  const right = Math.floor(Math.random() * 8) + 1;
  const answer = String(left + right);
  const expiresAt = Date.now() + 1000 * 60 * 10;
  const token = Buffer.from(`${answer}:${expiresAt}:${signChallenge(answer, expiresAt)}`).toString('base64url');
  return {
    prompt: `${left} + ${right} = ?`,
    token,
    expiresAt
  };
}

function verifyChallenge(token, answer) {
  try {
    const [expected, expiresAt, signature] = Buffer.from(token, 'base64url').toString('utf8').split(':');
    if (!expected || !expiresAt || !signature) {
      return false;
    }
    if (Date.now() > Number(expiresAt)) {
      return false;
    }
    if (String(answer).trim() !== expected) {
      return false;
    }
    const actual = signChallenge(expected, expiresAt);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(actual));
  } catch (error) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  try {
    const method = normalizeMethod(req);
    const body = method === 'GET' ? {} : await readBody(req);
    const action = req.query.action || body.action || (method === 'GET' ? 'list' : 'create');

    if (method === 'GET') {
      if (action === 'challenge') {
        return sendJson(res, 200, { ok: true, challenge: makeChallenge() });
      }
      const comments = await listGuestbookComments(false);
      return sendJson(res, 200, { ok: true, comments });
    }

    if (action === 'like') {
      const id = body.id;
      if (!id) {
        return sendJson(res, 400, { ok: false, message: '缺少 id' });
      }
      const likes = await likeGuestbookComment(id);
      return sendJson(res, 200, { ok: true, likes });
    }

    if (!verifyChallenge(body.challenge_token, body.challenge_answer)) {
      return sendJson(res, 400, { ok: false, message: '人机验证失败，请刷新后重试' });
    }

    const created = await createGuestbookComment(body, {
      forwardedFor: req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });
    return sendJson(res, 200, { ok: true, id: created.public_id, avatar: created.avatar });
  } catch (error) {
    return sendJson(res, 500, { ok: false, message: error.message || '服务器错误' });
  }
};
