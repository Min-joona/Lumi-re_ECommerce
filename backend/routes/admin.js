const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, permit } = require('../middleware/auth');
const audit = require('../utils/audit');

const router = express.Router();

router.get('/dashboard', protect, permit('dashboard.view'), async (_req, res) => {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday); startWeek.setDate(startToday.getDate() - 6);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const priorMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const paid = { isPaid: true };
  const sumSince = async (start, end) => (await Order.aggregate([{ $match: { ...paid, createdAt: { $gte: start, ...(end ? { $lt: end } : {}) } } }, { $group: { _id: null, value: { $sum: '$totalPrice' } } }]))[0]?.value || 0;
  const [today, week, month, prior, attention, lowStock, customers, products, recentActivity, trend] = await Promise.all([
    sumSince(startToday), sumSince(startWeek), sumSince(startMonth), sumSince(priorMonth, startMonth),
    Order.countDocuments({ status: { $in: ['Pending', 'Confirmed'] } }),
    Product.find({ $expr: { $lte: ['$countInStock', { $ifNull: ['$lowStockThreshold', 5] }] }, status: { $ne: 'Archived' } }).select('name slug countInStock lowStockThreshold image').limit(8),
    User.countDocuments({ role: 'customer' }), Product.countDocuments(),
    AuditLog.find().populate('actorId', 'name').sort({ createdAt: -1 }).limit(8),
    Order.aggregate([{ $match: { ...paid, createdAt: { $gte: startWeek } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);
  res.json({ metrics: { today, week, month, monthChange: prior ? ((month - prior) / prior) * 100 : 100, attention, customers, products }, lowStock, recentActivity, trend });
});

router.get('/customers', protect, permit('customers.manage'), async (req, res) => {
  const query = req.query.search ? { $or: [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }] } : {};
  const customers = await User.find({ ...query, role: 'customer' }).select('name email status createdAt').sort({ createdAt: -1 }).limit(100).lean();
  const ids = customers.map((u) => u._id);
  const stats = await Order.aggregate([{ $match: { user: { $in: ids }, isPaid: true } }, { $group: { _id: '$user', orders: { $sum: 1 }, lifetimeValue: { $sum: '$totalPrice' }, lastOrderAt: { $max: '$createdAt' } } }]);
  const byUser = Object.fromEntries(stats.map((s) => [String(s._id), s]));
  res.json(customers.map((user) => ({ ...user, ...(byUser[String(user._id)] || { orders: 0, lifetimeValue: 0, lastOrderAt: null }) })));
});

router.put('/customers/:id/status', protect, permit('customers.manage'), async (req, res) => {
  if (!['active', 'suspended', 'banned'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const customer = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { status: req.body.status }, { new: true });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  await audit(req, `customer.${req.body.status}`, 'User', customer._id, { status: req.body.status });
  res.json({ _id: customer._id, status: customer.status });
});

router.get('/audit-logs', protect, permit('audit.view'), async (_req, res) => {
  const logs = await AuditLog.find().populate('actorId', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

module.exports = router;
