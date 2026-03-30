import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['rider', 'driver'],
    default: 'rider'
  },
  dlNumber: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  availableForRides: {
    type: Boolean,
    default: false
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
