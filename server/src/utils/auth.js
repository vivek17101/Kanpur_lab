const crypto = require('crypto');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === 'change-this-local-development-secret') {
    throw new Error('AUTH_SECRET must be set to a secure value in production');
  }
  return secret;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || '').split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const candidate = hashPassword(password, salt).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(storedHash));
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(value) {
  return crypto.createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

function createToken(admin) {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({
    id: admin._id.toString(),
    username: admin.username,
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const unsigned = `${header}.${payload}`;

  return `${unsigned}.${sign(unsigned)}`;
}

function verifyToken(token) {
  const [header, payload, signature] = String(token || '').split('.');
  const unsigned = `${header}.${payload}`;

  if (!header || !payload || !signature || sign(unsigned) !== signature) {
    return null;
  }

  const data = base64UrlDecode(payload);

  if (!data.exp || data.exp < Date.now()) {
    return null;
  }

  return data;
}

module.exports = {
  createToken,
  hashPassword,
  verifyPassword,
  verifyToken,
};
