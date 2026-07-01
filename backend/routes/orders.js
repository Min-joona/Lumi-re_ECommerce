const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

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
    });
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
router.get('/', protect, admin, async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id  (auth)
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(order);
});

// PUT /api/orders/:id/status  (admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = req.body.status || order.status;
  if (order.status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  await order.save();
  res.json(order);
});

module.exports = router;
