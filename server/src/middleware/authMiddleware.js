const { verifyToken } = require('../utils/auth');

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const admin = verifyToken(token);

  if (!admin) {
    return res.status(401).json({ message: 'Admin login required' });
  }

  req.admin = {
    ...admin,
    _id: admin.id,
  };
  next();
}

module.exports = requireAdmin;
