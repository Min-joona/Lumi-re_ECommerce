const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin, permit } = require('../middleware/auth');
const InventoryLog = require('../models/InventoryLog');
const audit = require('../utils/audit');

const router = express.Router();

// POST /api/orders  (auth) — create order from cart
router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Re-price from DB to prevent tampering
    let itemsPrice = 0;
    const items = [];
    for (const ci of orderItems) {
      const p = await Product.findById(ci.product);
      if (!p) return res.status(404).json({ message: `Product ${ci.product} not found` });
      if (!Number.isInteger(ci.qty) || ci.qty < 1) return res.status(400).json({ message: 'Invalid item quantity' });
      if (p.countInStock < ci.qty) return res.status(409).json({ message: `${p.name} no longer has enough stock` });
      itemsPrice += p.price * ci.qty;
      items.push({ name: p.name, qty: ci.qty, image: p.image, price: p.price, product: p._id });
    }

    const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
    const taxPrice = +(itemsPrice * 0.08).toFixed(2);
    const totalPrice = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      orderItems: items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: true, // demo checkout auto-pays
      paidAt: Date.now(),
      status: 'Paid',
      timeline: [{ status: 'Paid', note: 'Order placed and payment recorded', actor: req.user._id }],
    });
    // Inventory is reserved when an order is placed, not when it ships.
    for (const item of items) {
      const updated = await Product.findOneAndUpdate({ _id: item.product, countInStock: { $gte: item.qty } }, { $inc: { countInStock: -item.qty } }, { new: true });
      if (!updated) return res.status(409).json({ message: `${item.name} just went out of stock` });
      await InventoryLog.create({ product: item.product, previousStock: updated.countInStock + item.qty, newStock: updated.countInStock, reason: `Reserved for order ${order._id}` });
    }
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/mine  (auth)
router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders  (admin)
router.get('/', protect, permit('orders.manage'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {};
  if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.customer) filter['$or'] = [{ 'shippingAddress.fullName': { $regex: req.query.customer, $options: 'i' } }];
  if (req.query.from || req.query.to) filter.createdAt = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(req.query.to) } : {}) };
  const [orders, count] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, page, pages: Math.ceil(count / limit), count });
});

// GET /api/orders/:id  (auth)
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!(req.user.isAdmin || req.user.role !== 'customer') && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(order);
});

// PUT /api/orders/:id/status  (admin)
router.put('/:id/status', protect, permit('orders.manage'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const previousStatus = order.status;
  order.status = req.body.status || order.status;
  if (!['Pending', 'Confirmed', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Refunded', 'Cancelled'].includes(order.status)) return res.status(400).json({ message: 'Invalid status' });
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
  if (req.body.reason) order.cancellationReason = req.body.reason;
  order.timeline.push({ status: order.status, note: req.body.note || req.body.reason || '', actor: req.user._id });
  if (order.status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  await order.save();
  await audit(req, 'order.status_update', 'Order', order._id, { from: previousStatus, to: order.status, trackingNumber: order.trackingNumber });
  res.json(order);
});

router.post('/:id/notes', protect, permit('orders.manage'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!req.body.body?.trim()) return res.status(400).json({ message: 'Note cannot be empty' });
  order.staffNotes.push({ body: req.body.body.trim(), author: req.user._id });
  await order.save();
  await audit(req, 'order.note_add', 'Order', order._id, { body: req.body.body.trim() });
  res.status(201).json(order.staffNotes.at(-1));
});

router.post('/:id/refunds', protect, permit('orders.manage'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  const amount = Number(req.body.amount);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const refunded = order.refunds.reduce((total, refund) => total + refund.amount, 0);
  if (!Number.isFinite(amount) || amount <= 0 || refunded + amount > order.totalPrice) return res.status(400).json({ message: 'Invalid refund amount' });
  order.refunds.push({ amount, reason: req.body.reason || 'Staff refund', actor: req.user._id });
  if (refunded + amount === order.totalPrice) order.status = 'Refunded';
  order.timeline.push({ status: order.status, note: `Refund issued: ${amount}`, actor: req.user._id });
  await order.save();
  await audit(req, 'order.refund_issue', 'Order', order._id, { amount, reason: req.body.reason });
  res.status(201).json(order);
});

module.exports = router;
