const jwt = require('jsonwebtoken');
const User = require('../models/User');

const rolePermissions = {
  super_admin: ['*'],
  admin: ['dashboard.view', 'products.manage', 'inventory.manage', 'orders.manage', 'customers.manage', 'audit.view'],
  manager: ['dashboard.view', 'products.manage', 'inventory.manage', 'orders.manage', 'customers.manage'],
  support: ['dashboard.view', 'orders.manage', 'customers.manage'],
  editor: ['dashboard.view', 'products.manage'],
  customer: [],
};

const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== 'access') throw new Error('Invalid token type');
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role !== 'customer')) return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const permit = (permission) => (req, res, next) => {
  if (!req.user || req.user.status !== 'active') return res.status(403).json({ message: 'Account is not active' });
  const granted = new Set([...(rolePermissions[req.user.role] || []), ...(req.user.permissions || [])]);
  if (req.user.isAdmin || granted.has('*') || granted.has(permission)) return next();
  return res.status(403).json({ message: `Missing permission: ${permission}` });
};

module.exports = { protect, admin, permit, rolePermissions };
