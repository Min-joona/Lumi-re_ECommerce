const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
app.set('trust proxy', 1);

// Security headers (this is a pure JSON API, so CSP is not needed)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// Rate limiting — generous globally, strict on auth to blunt brute force
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' },
  })
);

// Ensure DB connection before handling requests (serverless-friendly)
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'amar-ecommerce' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// One-time cloud seed, guarded by a shared secret (used when the local
// network can't reach Atlas directly). Not linked from anywhere public.
app.post('/api/seed', async (req, res) => {
  if (!process.env.SEED_TOKEN || req.headers['x-seed-token'] !== process.env.SEED_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const result = await require('./seedRunner')();
    res.json({ message: 'Seed complete', ...result });
  } catch (err) {
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
