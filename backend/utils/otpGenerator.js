// utils/otpGenerator.js

const generateOTP = () => {
  // Generate a 6-digit numeric OTP
  // Math.random() generates a number between 0 (inclusive) and 1 (exclusive)
  // Multiply by 900000 to get a number between 0 and 899999
  // Add 100000 to ensure it's always 6 digits (between 100000 and 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Set OTP expiry time (e.g., 10 minutes from now)
const setOTPExpiry = () => {
  // Create a new Date object for the current time
  const expiryDate = new Date();
  // Add 10 minutes (10 * 60 * 1000 milliseconds) to the current time
  expiryDate.setTime(expiryDate.getTime() + (10 * 60 * 1000)); // OTP valid for 10 minutes
  return expiryDate;
};

module.exports = { generateOTP, setOTPExpiry };