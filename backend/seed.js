/**
 * Seed the database with demo products and users.
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const products = require('./data/products');

const run = async () => {
  try {
    await connectDB();
    await Promise.all([Product.deleteMany(), User.deleteMany(), Order.deleteMany()]);

    await User.create({
      name: 'Amar Hassen',
      email: 'admin@shop.com',
      password: 'admin123',
      isAdmin: true,
    });
    await User.create({
      name: 'Demo Customer',
      email: 'customer@shop.com',
      password: 'demo123',
    });

    await Product.insertMany(products);

    console.log(`✓ Seeded ${products.length} products and 2 users.`);
    console.log('  Admin:    admin@shop.com / admin123');
    console.log('  Customer: customer@shop.com / demo123');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

run();
