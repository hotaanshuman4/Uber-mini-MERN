import express from 'express';
import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { calculateDistance, calculateFare, haversineKm } from '../utils/fareCalculator.js';

const router = express.Router();

const DRIVER_MATCH_RADIUS_KM = 50;
const MAX_TRIP_KM = 50;

/** ObjectId ref or populated doc → string id (avoids .driverId._id on plain ObjectId, which throws). */
function refIdString(ref) {
  if (ref == null) return null;
  if (typeof ref === 'object' && ref._id != null) return String(ref._id);
  return String(ref);
}

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'Database is not connected. Start MongoDB or set MONGO_URI in backend/.env, then restart the API.',
    });
  }
  next();
}

router.use(requireDb);

// Get all rides for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Pending ride requests for the logged-in captain
router.get('/driver/pending', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'driver') {
      return res.status(403).json({ message: 'Captain account required' });
    }
    const rides = await Ride.find({
      driverId: req.user.id,
      status: { $in: ['pending_driver', 'accepted', 'otp_verified'] },
    })
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Single ride (rider or assigned captain)
router.get('/detail/:rideId', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate('driverId', 'name email location availableForRides');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const uid = req.user.id.toString();
    const riderOk = ride.userId.toString() === uid;
    const driverOk = refIdString(ride.driverId) === uid;
    if (!riderOk && !driverOk) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.json(ride);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ride id' });
    }
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Calculate Fare before Booking
router.post('/calculate-fare', auth, (req, res) => {
  try {
    const { pickupCoords, dropoffCoords } = req.body;
    if (!pickupCoords || !dropoffCoords) {
      return res.status(400).json({ message: 'Missing coordinates' });
    }

    const distance = calculateDistance(
      pickupCoords[0], pickupCoords[1],
      dropoffCoords[0], dropoffCoords[1]
    );

    if (!Number.isFinite(distance) || Number.isNaN(distance)) {
      return res.status(400).json({ message: 'Invalid coordinates (must be numbers in lat/lng form).' });
    }

    if (distance > MAX_TRIP_KM) {
      return res.status(400).json({ message: `Ride exceeds maximum distance of ${MAX_TRIP_KM} km.` });
    }

    const vehiclesPricing = [
      { id: 'bike', name: 'GoCab Moto', price: calculateFare(distance, 'bike') },
      { id: 'uberx', name: 'GoCab Mini', price: calculateFare(distance, 'mini') },
      { id: 'black', name: 'GoCab Premium', price: calculateFare(distance, 'premium') },
      { id: 'uberxl', name: 'GoCab XL', price: calculateFare(distance, 'xl') },
    ];

    res.json({ distance: distance.toFixed(2), pricing: vehiclesPricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error calculating fare' });
  }
});

// Captain accepts a pending ride
router.post('/:rideId/accept', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    const assignedDriver = refIdString(ride.driverId);
    if (!assignedDriver || assignedDriver !== String(req.user.id)) {
      return res.status(403).json({ message: 'This trip is not assigned to you' });
    }
    if (ride.status !== 'pending_driver') {
      return res.status(400).json({ message: 'Trip is not waiting for acceptance' });
    }
    ride.status = 'accepted';
    await ride.save();
    const populated = await Ride.findById(ride._id).populate('driverId', 'name email location');
    res.json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ride id' });
    }
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Captain verifies OTP shared by rider — then navigation switches to route to destination
router.post('/:rideId/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    const assignedDriver = refIdString(ride.driverId);
    if (!assignedDriver || assignedDriver !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the assigned captain can verify OTP' });
    }
    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Accept the trip before verifying OTP' });
    }
    if (!otp || String(otp).trim() !== ride.otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    ride.otpVerified = true;
    ride.status = 'otp_verified';
    await ride.save();
    res.json(ride);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ride id' });
    }
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Captain completes a ride
router.post('/:rideId/complete', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    const assignedDriver = refIdString(ride.driverId);
    if (!assignedDriver || assignedDriver !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the assigned captain can complete the trip' });
    }
    if (ride.status !== 'otp_verified') {
      return res.status(400).json({ message: 'OTP must be verified before completing trip' });
    }
    ride.status = 'completed';
    await ride.save();
    res.json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Create a new ride (request captain; generates OTP)
router.post('/', auth, async (req, res) => {
  try {
    const { vehicleType, pickupName, dropoffName, pickupCoords, dropoffCoords, price } = req.body;
    if (!pickupCoords || !dropoffCoords) {
      return res.status(400).json({ message: 'Pickup and dropoff coordinates are required' });
    }

    const distance = calculateDistance(
      pickupCoords[0], pickupCoords[1],
      dropoffCoords[0], dropoffCoords[1]
    );
    if (!Number.isFinite(distance) || Number.isNaN(distance)) {
      return res.status(400).json({ message: 'Invalid coordinates (must be numbers in lat/lng form).' });
    }
    if (distance > MAX_TRIP_KM) {
      return res.status(400).json({ message: `Ride exceeds maximum distance of ${MAX_TRIP_KM} km.` });
    }

    const drivers = await User.find({
      role: 'driver',
      availableForRides: true,
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null }
    });

    let best = null;
    let bestD = Infinity;
    for (const d of drivers) {
      const km = haversineKm(
        pickupCoords[0], pickupCoords[1],
        d.location.lat, d.location.lng
      );
      if (km <= DRIVER_MATCH_RADIUS_KM && km < bestD) {
        bestD = km;
        best = d;
      }
    }

    if (!best) {
      return res.status(400).json({
        message:
          'No captain available within 50 km. A captain must register, open Captain dashboard, enable availability, and share location.'
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const ride = new Ride({
      userId: req.user.id,
      driverId: best._id,
      vehicleType,
      pickupName,
      dropoffName,
      pickupCoords,
      dropoffCoords,
      price: String(price),
      status: 'pending_driver',
      otp,
      otpVerified: false
    });
    await ride.save();

    const populated = await Ride.findById(ride._id).populate('driverId', 'name email location');

    res.json({
      ride: populated,
      otp,
      message: 'Share this OTP with your captain after they accept the trip.'
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

export default router;
