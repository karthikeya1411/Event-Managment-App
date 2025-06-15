const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  dob: {
    type: Date,
    required: true
  },
  role: {
    type: String,
    enum: ['attendee', 'organizer'],
    required: true
  },
   otp: { // To store the generated One-Time Password
    type: String,
    default: null,
  },
  otpExpiry: { // To store the expiry time of the OTP
    type: Date,
    default: null,
  },
    status: { // To track registration status
    type: String,
    enum: ['pending_verification', 'active', 'deactivated'], // Added 'deactivated' for failed attempts
    default: 'pending_verification', // New users start as pending
  },
  otpAttempts: { // To track OTP verification attempts
    type: Number,
    default: 0,
  },
  timeCreated: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);