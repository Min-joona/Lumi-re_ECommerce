/** Core seed logic, reused by the CLI (seed.js) and the guarded /api/seed route. */
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const products = require('./data/products');

async function runSeed() {
  await connectDB();
  await Promise.all([Product.deleteMany(), User.deleteMany(), Order.deleteMany()]);

  await User.create({ name: 'Amar Hassen', email: 'admin@shop.com', password: 'admin123', isAdmin: true });
  await User.create({ name: 'Demo Customer', email: 'customer@shop.com', password: 'demo123' });
  await Product.insertMany(products);

  return { users: 2, products: products.length };
}

module.exports = runSeed;
