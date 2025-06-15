const express = require('express');
const User = require('../models/User'); // Assuming this path is correct
const jwt = require('jsonwebtoken');
const router = express.Router();
const sendEmail = require('../utils/email'); // Ensure this is imported
const { generateOTP, setOTPExpiry } = require('../utils/otpGenerator'); // Ensure this is imported


/**
 * @desc    Register a new user (initiates OTP verification)
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password, dob, role }
 */
async function registerUser(req, res) {
  const { name, email, password, dob, role } = req.body;

  try {
    // 1. Check if user already exists and is active
    let user = await User.findOne({ email });

    if (user) {
      if (user.status === 'active') {
        return res.status(400).json({ message: 'User with this email already exists and is active.' });
      }
      // If user exists but is 'pending_verification' or 'deactivated', we can overwrite/update them
      // Or, we can simply resend OTP if they are pending (more user-friendly)
      if (user.status === 'pending_verification') {
        // Resend OTP if they are already in pending state
        const otp = generateOTP();
        const otpExpiry = setOTPExpiry();
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0; // Reset attempts on resend
        await user.save();

// ... (inside registerUser function)

    const otpHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <h1 style="color: #FFA000; margin: 0;">OTP Verification</h1>
                        <p style="font-size: 16px; color: #555;">Please verify your email address to complete registration.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Hello ${user.name},</p>
                        <p style="font-size: 16px;">Thank you for registering with us!</p>
                        <p style="font-size: 16px;">Your One-Time Password (OTP) for registration is:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; background-color: #f0f8f0; padding: 10px; border-radius: 5px;">${otp}</p>
                        <p style="font-size: 16px;">This OTP is valid for 10 minutes and can be used for up to ${MAX_OTP_ATTEMPTS} attempts.</p>
                        <p style="font-size: 16px;">Please enter this OTP on the registration confirmation page to activate your account.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center">
                        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    // ... (then, inside the sendEmail call)
    await sendEmail(
        "22311a0563@cse.sreenidhi.edu.in",
        //user.email,
        'Confirm Your Registration - OTP',
        `Your OTP for registration is: ${otp}. It is valid for 10 minutes and ${MAX_OTP_ATTEMPTS} attempts.`, // Plain text version
        otpHtmlContent // The elegant HTML version
    );

        return res.status(200).json({ message: 'User already in pending state. New OTP sent to your email for verification.' });
      } else if (user.status === 'deactivated') {
          // If deactivated, treat as new registration or ask them to contact support
          // For simplicity, let's allow them to re-register which overwrites their data
          user.name = name;
          user.password = password; // Will be hashed by pre-save middleware
          user.dob = dob;
          user.role = role || 'attendee'; // Default to attendee if not specified
          user.status = 'pending_verification';
          user.otp = null; // Clear old OTP before generating new one
          user.otpExpiry = null;
          user.otpAttempts = 0;
      }
    } else {
      // 2. Create a new user with status 'pending_verification'
      user = new User({
        name,
        email,
        password, // Pre-save hook will hash this
        dob,
        role: role || 'attendee', // Default to attendee if not specified
        status: 'pending_verification',
        otpAttempts: 0,
      });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save(); // Save the pending user

    // 3. Send elegant OTP email (placeholder for now, detailed in Part 3)
   // ... (inside registerUser function)

    const otpHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <h1 style="color: #FFA000; margin: 0;">OTP Verification</h1>
                        <p style="font-size: 16px; color: #555;">Please verify your email address to complete registration.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Hello ${user.name},</p>
                        <p style="font-size: 16px;">Thank you for registering with us!</p>
                        <p style="font-size: 16px;">Your One-Time Password (OTP) for registration is:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; background-color: #f0f8f0; padding: 10px; border-radius: 5px;">${otp}</p>
                        <p style="font-size: 16px;">This OTP is valid for 10 minutes and can be used for up to ${MAX_OTP_ATTEMPTS} attempts.</p>
                        <p style="font-size: 16px;">Please enter this OTP on the registration confirmation page to activate your account.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center">
                        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    // ... (then, inside the sendEmail call)
    await sendEmail(
      "22311a0563@cse.sreenidhi.edu.in",
        //user.email,
        'Confirm Your Registration - OTP',
        `Your OTP for registration is: ${otp}. It is valid for 10 minutes and ${MAX_OTP_ATTEMPTS} attempts.`, // Plain text version
        otpHtmlContent // The elegant HTML version
    );

    res.status(202).json({ message: 'Registration initiated. OTP sent to your email for verification.' });

  } catch (error) {
    console.error("Error during user registration initiation:", error);
    if (error.code === 11000) { // Duplicate key error (email unique constraint)
        return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// routes/auth.js
// ... (existing imports, including User, sendEmail, generateOTP, setOTPExpiry, and jwt)

const MAX_OTP_ATTEMPTS = 3; // Define max OTP attempts

/**
 * @desc    Verify OTP and activate user account
 * @route   POST /api/auth/verify-registration-otp
 * @access  Public
 * @body    { email, otp }
 */
async function verifyRegistrationOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ message: 'Account is already active. Please log in.' });
    }

    if (user.status === 'deactivated') {
      return res.status(400).json({ message: 'This account has been deactivated due to too many failed OTP attempts. Please contact support or try registering again.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found or OTP session expired. Please re-initiate registration.' });
    }

    // 1. Check for OTP expiry
    if (user.otpExpiry < new Date()) {
      user.otp = null;
      user.otpExpiry = null;
      user.status = 'deactivated'; // Deactivate expired OTP accounts
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Your registration session has ended. Please register again.' });
    }

    // 2. Check OTP attempts
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.status = 'deactivated'; // Mark as deactivated after max attempts
      user.otp = null; // Clear OTP
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: `Maximum OTP attempts (${MAX_OTP_ATTEMPTS}) exceeded. Your account has been deactivated. Please register again or contact support.` });
    }

    // 3. Verify OTP
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const attemptsLeft = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({ message: `Invalid OTP. Attempts left: ${attemptsLeft}.` });
    }

    // OTP is valid!
    user.status = 'active'; // Activate the account
    user.otp = null; // Clear OTP fields
    user.otpExpiry = null;
    user.otpAttempts = 0; // Reset attempts
    await user.save(); // Save the activated user

    // 4. Send beautiful welcome email
    const welcomeHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2f7; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <h1 style="color: #0288d1; margin: 0;">Welcome to Eventify!</h1>
                        <p style="font-size: 16px; color: #555;">Your ultimate event management platform.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Dear ${user.name},</p>
                        <p style="font-size: 16px;">Your account has been successfully created and activated!</p>
                        <p style="font-size: 16px;">We're thrilled to have you on board. You can now:</p>
                        <ul style="font-size: 16px; margin-left: 20px; padding: 0;">
                            <li>Discover and book exciting events.</li>
                            <li>(For Organizers) Create and manage your own events.</li>
                        </ul>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="YOUR_FRONTEND_LOGIN_URL" style="background-color: #0288d1; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">Login to Your Account</a>
                        </p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center">
                        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      "22311a0563@cse.sreenidhi.edu.in",
      //user.email,
      'Welcome to Eventify!',
      `Dear ${user.name},\n\nWelcome to Eventify! Your account has been successfully created and activated. You can now log in.\n\nThank you!`,
      welcomeHtmlContent
    );
    console.log(`Welcome email sent to ${user.email}`);

  const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
      res.status(200).json({
      message: 'Account activated successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// Login function using async/await
async function loginUser(req, res) {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password); // Assuming comparePassword returns a Promise

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    // Catch any errors from User.findOne, comparePassword, or jwt.sign
    console.error("Error during user login:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// routes/auth.js

const MAX_RESET_OTP_ATTEMPTS = 3; // Max attempts for password reset OTP

/**
 * @desc    Request OTP for password reset
 * @route   POST /api/auth/request-password-reset-otp
 * @access  Public
 * @body    { email }
 */
async function requestPasswordResetOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if email exists or not.
      // Always send a success message if email format is valid, but don't send OTP.
      // This prevents enumeration attacks.
      console.warn(`Password reset requested for non-existent or inactive email: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    // Only allow reset for active accounts
    if (user.status !== 'active') {
      return res.status(400).json({ message: 'Account is not active. Please activate your account first.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry(); // Use the same 10-minute expiry

    // Store OTP in user's document
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0; // Reset attempts for this new OTP
    await user.save();

    // Send elegant OTP email for password reset
    const otpHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <h1 style="color: #FFA000; margin: 0;">Password Reset OTP</h1>
                        <p style="font-size: 16px; color: #555;">Use this code to reset your password.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Hello ${user.name},</p>
                        <p style="font-size: 16px;">You have requested a password reset for your Eventify account.</p>
                        <p style="font-size: 16px;">Your One-Time Password (OTP) for password reset is:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; background-color: #f0f8f0; padding: 10px; border-radius: 5px;">${otp}</p>
                        <p style="font-size: 16px;">This OTP is valid for 10 minutes and can be used for up to ${MAX_RESET_OTP_ATTEMPTS} attempts.</p>
                        <p style="font-size: 16px;">Please enter this OTP on the password reset page to set your new password.</p>
                        <p style="font-size: 14px; color: #888;">If you did not request a password reset, please ignore this email.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center">
                        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      "22311a0563@cse.sreenidhi.edu.in",
      //user.email,
      'Eventify: Your Password Reset OTP',
      `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      otpHtmlContent
    );

    res.status(200).json({ message: 'OTP sent to your email for password reset verification.' });

  } catch (error) {
    console.error("Error requesting password reset OTP:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

/**
 * @desc    Verify OTP and reset user password
 * @route   POST /api/auth/reset-password
 * @access  Public
 * @body    { email, otp, newPassword }
 */
async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.status !== 'active') {
      return res.status(400).json({ message: 'Account is not active or has been deactivated.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found or OTP session expired. Please re-initiate password reset.' });
    }

    // Check for OTP expiry
    if (user.otpExpiry < new Date()) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0; // Reset attempts
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new password reset.' });
    }

    // Check OTP attempts
    if (user.otpAttempts >= MAX_RESET_OTP_ATTEMPTS) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0; // Reset attempts
      // user.status = 'deactivated'; // Optional: Deactivate account after too many failed attempts for security
      await user.save();
      return res.status(400).json({ message: `Maximum OTP attempts (${MAX_RESET_OTP_ATTEMPTS}) exceeded. Please request a new password reset.` });
    }

    // Verify OTP
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const attemptsLeft = MAX_RESET_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({ message: `Invalid OTP. Attempts left: ${attemptsLeft}.` });
    }

    // OTP is valid! Reset password
    user.password = newPassword; // Pre-save hook will hash this
    user.otp = null; // Clear OTP fields
    user.otpExpiry = null;
    user.otpAttempts = 0; // Reset attempts
    await user.save(); // Save the user with new password

    // Send security email for password reset confirmation
    const securityHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f8f0; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <h1 style="color: #4CAF50; margin: 0;">Password Successfully Reset!</h1>
                        <p style="font-size: 16px; color: #555;">Your Eventify account is now secure.</p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Dear ${user.name},</p>
                        <p style="font-size: 16px;">This is a confirmation that the password for your Eventify account (<strong>${user.email}</strong>) has been successfully reset.</p>
                        <p style="font-size: 16px;">If you did not initiate this password reset, please contact our support team immediately.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="YOUR_FRONTEND_LOGIN_URL" style="background-color: #0288d1; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">Login to Your Account</a>
                        </p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center">
                        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      "22311a0563@cse.sreenidhi.edu.in",
      //user.email,
      'Eventify: Your Password Has Been Reset',
      `Dear ${user.name},\n\nYour password for Eventify account ${user.email} has been successfully reset.`,
      securityHtmlContent
    );
    console.log(`Password reset security email sent to ${user.email}`);

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/request-password-reset-otp', requestPasswordResetOtp);
router.post('/reset-password', resetPassword);
module.exports = router;