const express = require('express');
const Product = require('../models/Product');
const { protect, permit } = require('../middleware/auth');
const InventoryLog = require('../models/InventoryLog');
const audit = require('../utils/audit');

const router = express.Router();

// GET /api/products?search=&category=&sort=&page=&featured=
router.get('/', async (req, res) => {
  try {
    const { search, category, sort, featured, minRating } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const sortMap = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ products, page, pages: Math.ceil(count / limit), count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (_req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

// Admin catalogue tools. Kept before /:slug so these never resolve as a product slug.
router.post('/admin/bulk', protect, permit('products.manage'), async (req, res) => {
  try {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'Select at least one product' });
    const updates = action === 'price' ? { price: Number(value) }
      : action === 'category' ? { category: String(value) }
        : action === 'status' ? { status: value }
          : null;
    if (!updates) return res.status(400).json({ message: 'Unsupported bulk action' });
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: updates });
    await audit(req, `products.bulk_${action}`, 'Product', ids.join(','), updates);
    res.json({ modified: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/duplicate', protect, permit('products.manage'), async (req, res) => {
  try {
    const original = await Product.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Product not found' });
    delete original._id; delete original.createdAt; delete original.updatedAt;
    original.name = `${original.name} (copy)`;
    original.slug = `${original.slug}-copy-${Date.now().toString().slice(-5)}`;
    original.status = 'Draft';
    const product = await Product.create(original);
    await audit(req, 'product.duplicate', 'Product', product._id, { sourceId: req.params.id });
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/inventory', protect, permit('inventory.manage'), async (req, res) => {
  try {
    const { stock, reason = 'Manual stock adjustment', variantSku } = req.body;
    if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ message: 'Stock must be a whole non-negative number' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    let previousStock;
    if (variantSku) {
      const variant = product.variants.find((v) => v.sku === variantSku);
      if (!variant) return res.status(404).json({ message: 'Variant not found' });
      previousStock = variant.countInStock; variant.countInStock = stock;
    } else { previousStock = product.countInStock; product.countInStock = stock; }
    await product.save();
    await InventoryLog.create({ product: product._id, variantSku, previousStock, newStock: stock, reason, actorId: req.user._id });
    await audit(req, 'inventory.adjust', 'Product', product._id, { previousStock, stock, variantSku, reason });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/inventory-history', protect, permit('inventory.manage'), async (req, res) => {
  const history = await InventoryLog.find({ product: req.params.id }).populate('actorId', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json(history);
});

// GET /api/products/:id/recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'Active'
    }).sort({ rating: -1 }).limit(8);
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// POST /api/products/:slug/reviews  (auth)
router.post('/:slug/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.reviews.push({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    });
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  (admin)
router.post('/', protect, permit('products.manage'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await audit(req, 'product.create', 'Product', product._id, { name: product.name });
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/products/:id  (admin)
router.put('/:id', protect, permit('products.manage'), async (req, res) => {
  try {
    const previous = await Product.findById(req.params.id).lean();
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await audit(req, 'product.update', 'Product', product._id, { before: previous, after: req.body });
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/products/:id  (admin)
router.delete('/:id', protect, permit('products.manage'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await audit(req, 'product.delete', 'Product', product._id, { name: product.name });
  res.json({ message: 'Product removed' });
});

module.exports = router;
