const jwt = require('jsonwebtoken');
const { users } = require('./data');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

// Define permissions for each role
const ROLE_PERMISSIONS = {
  ADMIN: {
    // Admin has full permissions
    addShipment: true,
    updateShipment: true,
    deleteShipment: true,
    viewAllShipments: true,
    viewDetailedReports: true,
    manageUsers: true,
    flagShipment: true,
  },
  EMPLOYEE: {
    // Employee has limited permissions
    addShipment: false, // Employees cannot add shipments
    updateShipment: true, // Can update shipments
    deleteShipment: false, // Cannot delete shipments
    viewAllShipments: true,
    viewDetailedReports: false, // Cannot view detailed reports
    manageUsers: false,
    flagShipment: true, // Can flag shipments
  },
};

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

function checkPermission(context, permission) {
  const { user } = context;
  if (!user) {
    throw new Error('Authentication required.');
  }

  const permissions = ROLE_PERMISSIONS[user.role];
  if (!permissions || !permissions[permission]) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || {};
}

module.exports = {
  generateToken,
  getUserFromToken,
  requireRole,
  checkPermission,
  getPermissionsForRole,
  ROLE_PERMISSIONS,
};

