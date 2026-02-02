const jwt = require('jsonwebtoken');
const { users } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

function getUserFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === decoded.sub);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  } catch (err) {
    return null;
  }
}

function requireRole(context, allowedRoles) {
  const { user } = context;
  if (!user) {
    throw new Error('Authentication required.');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error('You do not have permission to perform this action.');
  }
}

module.exports = {
  generateToken,
  getUserFromToken,
  requireRole,
};

