const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin, permit } = require('../middleware/auth');
const InventoryLog = require('../models/InventoryLog');
const audit = require('../utils/audit');

const router = express.Router();

// POST /api/orders  (auth) — create order from cart
router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;
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
    let discountPrice = 0;
    let couponApplied = null;
    let finalTotal = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && new Date(coupon.expiryDate) >= new Date()) {
        if (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) {
          couponApplied = coupon._id;
          if (coupon.discountType === 'percentage') {
            discountPrice = itemsPrice * (coupon.discountValue / 100);
          } else {
            discountPrice = coupon.discountValue;
          }
          finalTotal = Math.max(0, finalTotal - discountPrice);
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountPrice,
      couponApplied,
      totalPrice: finalTotal,
      isPaid: false,
      status: 'Pending',
      timeline: [{ status: 'Pending', note: 'Order placed, awaiting payment', actor: req.user._id }],
    });
    // Inventory is reserved when an order is placed, not when it ships.
    for (const item of items) {
      const updated = await Product.findOneAndUpdate({ _id: item.product, countInStock: { $gte: item.qty } }, { $inc: { countInStock: -item.qty } }, { new: true });
      if (!updated) return res.status(409).json({ message: `${item.name} just went out of stock` });
      await InventoryLog.create({ product: item.product, previousStock: updated.countInStock + item.qty, newStock: updated.countInStock, reason: `Reserved for order ${order._id}` });
    }

    // Initialize Chapa transaction
    let checkout_url = null;
    if (paymentMethod !== 'Cash on Delivery') {
      try {
        const chapaPayload = {
          amount: finalTotal,
          currency: 'ETB',
          email: req.user.email,
          first_name: req.user.name.split(' ')[0],
          last_name: req.user.name.split(' ').slice(1).join(' ') || 'Customer',
          tx_ref: order._id.toString(),
          callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/webhook/chapa`,
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}`,
          customization: {
             title: 'Lumière Store',
             description: 'Payment for your order'
          }
        };

        const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(chapaPayload)
        });

        const data = await response.json();
        if (data.status === 'success') {
          checkout_url = data.data.checkout_url;
        } else {
          console.error('Chapa init failed:', data);
        }
      } catch (err) {
        console.error('Chapa error:', err);
      }
    }

    res.status(201).json({ order, checkout_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/mine  (auth)
router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// POST /api/orders/webhook/chapa
router.post('/webhook/chapa', express.json(), async (req, res) => {
  try {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', process.env.CHAPA_SECRET_KEY || '').update(JSON.stringify(req.body)).digest('hex');
    
    // Optional: Validate signature if present
    if (req.headers['chapa-signature'] && hash !== req.headers['chapa-signature']) {
      return res.status(400).send('Invalid signature');
    }
    
    const { tx_ref, status } = req.body;
    if (status === 'success') {
      const order = await Order.findById(tx_ref);
      if (order && !order.isPaid) {
        // Verify with Chapa API directly to prevent spoofing
        const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
          headers: { 'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}` }
        });
        const data = await response.json();
        
        if (data.status === 'success' && data.data.status === 'success') {
           order.isPaid = true;
           order.paidAt = Date.now();
           order.status = 'Paid';
           order.timeline.push({ status: 'Paid', note: 'Payment received via Chapa', actor: order.user });
           await order.save();
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
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
