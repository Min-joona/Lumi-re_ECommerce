const express = require('express');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ message: 'Coupon is inactive' });
    if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });

    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin routes could go here...

module.exports = router;
