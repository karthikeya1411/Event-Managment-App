// This is an inferred schema for your OTP model,
// typically defined in a backend file like models/OTP.js if using Mongoose

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // References the User model
    required: true,
    ref: 'User'
  },
  otp: {
    type: String, // The generated one-time password (e.g., "123456")
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId, // References the Booking model
    required: false, // Can be true if OTPs are *always* tied to a booking
    ref: 'Booking'
  },
  action: {
    type: String, // Describes the purpose: 'confirm_booking', 'register', 'reset_password', etc.
    enum: ['confirm_booking', 'register', 'reset_password', 'confirm_cancel'], // Example allowed actions
    required: true
  },
  expiresAt: {
    type: Date, // The timestamp when the OTP becomes invalid
    required: true,
    // This is crucial for auto-deleting expired OTPs in MongoDB
    index: { expires: 0 } // Mongoose TTL index to expire documents automatically
  },
  createdAt: { // Optional, but good practice for tracking
    type: Date,
    default: Date.now
  }
});

// The actual Mongoose model
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;