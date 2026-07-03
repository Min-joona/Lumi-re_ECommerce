/**
 * Seed the database with demo products and users.
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const runSeed = require('./seedRunner');

runSeed()
  .then((result) => {
    console.log(`✓ Seeded ${result.products} products and ${result.users} users.`);
    console.log('  Admin:    admin@shop.com / admin123');
    console.log('  Customer: customer@shop.com / demo123');
    return mongoose.connection.close();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
