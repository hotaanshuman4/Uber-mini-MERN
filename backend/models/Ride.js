import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vehicleType: {
    type: String,
    required: true
  },
  pickupName: {
    type: String,
    required: true
  },
  dropoffName: {
    type: String,
    required: true
  },
  pickupCoords: {
    type: [Number],
    required: true
  },
  dropoffCoords: {
    type: [Number],
    required: true
  },
  price: {
    type: String,
    required: true
  },
  status: {
    type: String,
    // Include legacy values from older DB documents
    enum: ['pending_driver', 'accepted', 'otp_verified', 'completed', 'cancelled', 'Completed'],
    default: 'pending_driver'
  },
  otp: {
    type: String,
    required: true
  },
  otpVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Ride', rideSchema);
