const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}-refresh`;
const signAccessToken = (id) => jwt.sign({ id, type: 'access' }, accessSecret, { expiresIn: '15m' });
const signRefreshToken = (id, sessionId) => jwt.sign({ id, sessionId, type: 'refresh' }, refreshSecret, { expiresIn: '30d' });
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  isAdmin: u.isAdmin,
  role: u.role === 'customer' && u.isAdmin ? 'admin' : u.role,
  permissions: u.permissions || [],
  status: u.status,
});

const issueTokens = async (user, req, res) => {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user._id, sessionId);
  user.refreshSessions.push({
    _id: sessionId,
    tokenHash: hash(refreshToken),
    userAgent: req.get('user-agent') || 'Unknown device',
    ip: req.ip,
    expiresAt: new Date(Date.now() + cookieOptions.maxAge),
  });
  user.refreshSessions = user.refreshSessions.slice(-8);
  await user.save();
  res.cookie('refreshToken', refreshToken, cookieOptions);
  return signAccessToken(user._id);
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = await issueTokens(user, req, res);
    res.status(201).json({ user: publicUser(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') return res.status(403).json({ message: 'This account is not active' });
    const token = await issueTokens(user, req, res);
    res.json({ user: publicUser(user), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/me
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = req.user;
    
    if (name) user.name = name;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (password) user.password = password;
    
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/refresh — rotate the httpOnly refresh cookie and return a short-lived access token.
router.post('/refresh', async (req, res) => {
  try {
    const cookie = req.headers.cookie?.split(';').map((v) => v.trim()).find((v) => v.startsWith('refreshToken='));
    const refreshToken = cookie?.slice('refreshToken='.length);
    if (!refreshToken) return res.status(401).json({ message: 'No refresh session' });
    const decoded = jwt.verify(refreshToken, refreshSecret);
    if (decoded.type !== 'refresh' || !decoded.iat || !decoded.exp) throw new Error('Invalid refresh token');
    const user = await User.findById(decoded.id);
    const session = user?.refreshSessions.id(decoded.sessionId);
    if (!user || !session || session.tokenHash !== hash(refreshToken) || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh session expired' });
    }
    user.refreshSessions.pull(session._id);
    const token = await issueTokens(user, req, res);
    res.json({ user: publicUser(user), token });
  } catch (_error) {
    res.clearCookie('refreshToken', cookieOptions);
    res.status(401).json({ message: 'Refresh session invalid' });
  }
});

router.post('/logout', protect, async (req, res) => {
  const cookie = req.headers.cookie?.split(';').map((v) => v.trim()).find((v) => v.startsWith('refreshToken='));
  if (cookie) req.user.refreshSessions = req.user.refreshSessions.filter((s) => s.tokenHash !== hash(cookie.slice(13)));
  await req.user.save();
  res.clearCookie('refreshToken', cookieOptions);
  res.status(204).end();
});

router.get('/sessions', protect, async (req, res) => {
  res.json(req.user.refreshSessions.map((s) => ({ id: s._id, userAgent: s.userAgent, ip: s.ip, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt })));
});

router.delete('/sessions/:id', protect, async (req, res) => {
  req.user.refreshSessions.pull(req.params.id);
  await req.user.save();
  res.status(204).end();
});

module.exports = router;
