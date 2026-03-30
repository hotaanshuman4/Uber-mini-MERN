import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'Database is not connected. Check your MONGO_URI in backend/.env (make sure MongoDB Atlas IP whitelist allows your current IP, e.g. 0.0.0.0/0 for all IPs), then restart the API server.',
    });
  }
  next();
}

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', requireDb, async (req, res) => {
  try {
    const { name, password, role, dlNumber } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const hasAlphanumeric = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9\s]/.test(password);
    if (!hasAlphanumeric || !hasSpecialChar)
      return res.status(400).json({
        message: 'Password must contain letters, numbers, and at least one special character',
      });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    if (role === 'driver' && !dlNumber)
      return res.status(400).json({ message: 'Driving License number is required for drivers' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'rider',
      dlNumber: role === 'driver' ? dlNumber : null,
    });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '10h',
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, dlNumber: user.dlNumber },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'User already exists' });
    if (err.name === 'ValidationError')
      return res
        .status(400)
        .json({ message: Object.values(err.errors).map((v) => v.message).join(', ') });
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', requireDb, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '10h',
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, dlNumber: user.dlNumber },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── Mock Google Auth (no real OAuth needed) ──────────────────────────────────
// The frontend sends a mock payload: { mockGoogle: true, email, name, role }
// OR a real Google access token: { token, role } — both are handled here.
router.post('/google', requireDb, async (req, res) => {
  try {
    const { token, role, mockGoogle, email: mockEmail, name: mockName } = req.body;

    let email, name;

    if (mockGoogle && mockEmail) {
      // ── Mock flow (no real Google OAuth) ──
      email = normalizeEmail(mockEmail);
      name = mockName || 'Google User';
    } else if (token) {
      // ── Real Google access-token flow ──
      const fetchRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!fetchRes.ok) {
        return res.status(401).json({ message: 'Invalid Google token' });
      }
      const googleData = await fetchRes.json();
      email = normalizeEmail(googleData.email);
      name = googleData.name || 'Google User';
    } else {
      return res.status(400).json({ message: 'No Google token or mock payload provided' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        Math.random().toString(36).substring(2, 10) + 'Gg!',
        salt,
      );
      user = new User({ name, email, password: hashedPassword, role: role || 'rider' });
      await user.save();
    }

    const sessionToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '10h' },
    );
    res.json({
      token: sessionToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, dlNumber: user.dlNumber },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── Captain: update availability / location ──────────────────────────────────
router.patch('/driver', requireDb, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'driver')
      return res.status(403).json({ message: 'Captain account required' });

    const { available, lat, lng } = req.body;
    if (typeof available === 'boolean') user.availableForRides = available;
    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      user.location = { lat: Number(lat), lng: Number(lng) };
    }
    await user.save();
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      availableForRides: user.availableForRides,
      location: user.location,
    });
  } catch (err) {
    console.error('Driver patch error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get('/me', requireDb, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    if (!decoded?.user?.id) return res.status(401).json({ message: 'Token is not valid' });

    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    res.json(user);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'CastError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    console.error('Me error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

export default router;
