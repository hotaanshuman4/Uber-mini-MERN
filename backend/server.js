import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

// ─── MongoDB Connection (with retry) ──────────────────────────────────────────
async function connectDB(attempt = 1) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uber_clone';
  if (attempt === 1) {
    console.log('Connecting to MongoDB…', MONGO_URI.substring(0, 40) + '...');
  }
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (err) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}):`, err.message);
    if (attempt < 5) {
      const delay = attempt * 3000;
      console.log(`   Retrying in ${delay / 1000}s…`);
      setTimeout(() => connectDB(attempt + 1), delay);
    } else {
      console.error('   ❌ MongoDB unavailable after 5 attempts — auth routes will return 503.');
    }
  }
}

connectDB();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbState: mongoose.connection.readyState,
    env: process.env.MONGO_URI ? 'set' : 'missing',
  });
});

// ─── Error handlers (log but do NOT exit — nodemon stays alive) ───────────────
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err?.message ?? err);
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const activeDrivers = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('driver_online', (data) => {
    activeDrivers[socket.id] = { driverId: data.driverId, location: data.location };
    console.log(`Driver ${data.driverId} online`);
  });

  socket.on('driver_location_update', (data) => {
    if (activeDrivers[socket.id]) {
      activeDrivers[socket.id].location = data.location;
      io.emit('drivers_available', Object.values(activeDrivers));
    }
  });

  socket.on('request_ride', (rideData) => {
    socket.broadcast.emit('new_ride_request', { ...rideData, riderSocketId: socket.id });
  });

  socket.on('accept_ride', (data) => {
    io.to(data.riderSocketId).emit('ride_accepted', {
      driverId: data.driverId,
      driverLocation: activeDrivers[socket.id]?.location || null,
      rideDetails: data.rideDetails,
      driverSocketId: socket.id,
    });
  });

  socket.on('ride_progress', (data) => {
    socket.to(data.targetSocketId).emit('ride_progress_update', data.location);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    if (activeDrivers[socket.id]) {
      delete activeDrivers[socket.id];
      io.emit('drivers_available', Object.values(activeDrivers));
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
