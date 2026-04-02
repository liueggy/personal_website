const crypto = require('crypto');

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function getAdminSecret() {
  return process.env.ADMIN_TOKEN_SECRET
    || process.env.ADMIN_PASSWORD
    || process.env.POSTGRES_URL
    || 'change-this-secret';
}

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || 'admin';
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '666666qaz';
}

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getAdminSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }
  const [encoded, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', getAdminSecret())
    .update(encoded)
    .digest('base64url');

  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function validateAdminCredentials(username, password) {
  return safeEqual(username, getAdminUsername()) && safeEqual(password, getAdminPassword());
}

function createAdminToken(username) {
  return signToken({
    sub: username,
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12
  });
}

module.exports = {
  createAdminToken,
  getAdminUsername,
  validateAdminCredentials,
  verifyToken
};
