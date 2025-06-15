const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const sendEmail = require('../utils/email');
const { generateOTP, setOTPExpiry } = require('../utils/otpGenerator');
const authMiddleware = require('../middleware/auth');
//const OTP = require('../models/OTP');

const TARGET_EMAIL_FOR_ALL_MAILS = "22311a0563@cse.sreenidhi.edu.in";
const LOGO_URL = "https://www.dpsnacharam.in/assets/images/Homepage_Logos/dps-nc-white-logo.png"; // Placeholder, replace with your hosted logo URL
const TERMS_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-terms-conditions-agreement.pdf";   // Replace with your actual T&C URL
const PRIVACY_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-privacy-policy-template.pdf";  

const MAX_OTP_ATTEMPTS = 3;
const MAX_RESET_OTP_ATTEMPTS = 3;

/**
 * @desc    Register a new user (initiates OTP verification)
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password, dob, role }
 */
async function registerUser(req, res) {
  const { name, email, password, dob, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (user.status === 'active') {
        return res.status(400).json({ message: 'User with this email already exists and is active.' });
      }
      if (user.status === 'pending_verification') {
        const otp = generateOTP();
        const otpExpiry = setOTPExpiry();
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0;
        await user.save();

        const otpHtmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4CAF50; padding: 20px 0; color: #ffffff;">
                    <tr>
                        <td align="center" style="padding-bottom: 10px;">
                            <img src="${LOGO_URL}" alt="Elite Events Logo" style="height: 50px; display: block; margin: 0 auto;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-top: 5px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Elite Events</h1>
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
                        <td align="center" style="padding: 10px 20px;">
                            <p style="font-size: 12px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Elite Events. All rights reserved.</p>
                            <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
                                <a href="${TERMS_URL}" style="color: #aaa; text-decoration: none;">Terms & Conditions</a> |
                                <a href="${PRIVACY_URL}" style="color: #aaa; text-decoration: none;">Privacy Policy</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        await sendEmail(
            TARGET_EMAIL_FOR_ALL_MAILS,
            'Elite Events: Confirm Your Registration - OTP',
            `Your OTP for registration is: ${otp}. It is valid for 10 minutes and ${MAX_OTP_ATTEMPTS} attempts.`,
            otpHtmlContent
        );

        return res.status(200).json({ message: 'User already in pending state. New OTP sent to your email for verification.' });
      } else if (user.status === 'deactivated') {
          user.name = name;
          user.password = password;
          user.dob = dob;
          user.role = role || 'attendee';
          user.status = 'pending_verification';
          user.otp = null;
          user.otpExpiry = null;
          user.otpAttempts = 0;
      }
    } else {
      user = new User({
        name,
        email,
        password,
        dob,
        role: role || 'attendee',
        status: 'pending_verification',
        otpAttempts: 0,
      });
    }

    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const otpHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4CAF50; padding: 20px 0; color: #ffffff;">
                <tr>
                    <td align="center" style="padding-bottom: 10px;">
                        <img src="${LOGO_URL}" alt="Elite Events Logo" style="height: 50px; display: block; margin: 0 auto;">
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 5px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Elite Events</h1>
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
                    <td align="center" style="padding: 10px 20px;">
                        <p style="font-size: 12px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Elite Events. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            <a href="${TERMS_URL}" style="color: #aaa; text-decoration: none;">Terms & Conditions</a> |
                            <a href="${PRIVACY_URL}" style="color: #aaa; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      TARGET_EMAIL_FOR_ALL_MAILS,
        'Elite Events: Confirm Your Registration - OTP',
        `Your OTP for registration is: ${otp}. It is valid for 10 minutes and ${MAX_OTP_ATTEMPTS} attempts.`,
        otpHtmlContent
    );

    res.status(202).json({ message: 'Registration initiated. OTP sent to your email for verification.' });

  } catch (error) {
    console.error("Error during user registration initiation:", error);
    if (error.code === 11000) {
        return res.status(409).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

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

    if (user.otpExpiry < new Date()) {
      user.otp = null;
      user.otpExpiry = null;
      user.status = 'deactivated';
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Your registration session has ended. Please register again.' });
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.status = 'deactivated';
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: `Maximum OTP attempts (${MAX_OTP_ATTEMPTS}) exceeded. Your account has been deactivated. Please register again or contact support.` });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const attemptsLeft = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({ message: `Invalid OTP. Attempts left: ${attemptsLeft}.` });
    }

    user.status = 'active';
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    const welcomeHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4CAF50; padding: 20px 0; color: #ffffff;">
                <tr>
                    <td align="center" style="padding-bottom: 10px;">
                        <img src="${LOGO_URL}" alt="Elite Events Logo" style="height: 50px; display: block; margin: 0 auto;">
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 5px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Elite Events</h1>
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
                            <li style="margin-bottom: 5px;">Discover and book exciting events.</li>
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
                    <td align="center" style="padding: 10px 20px;">
                        <p style="font-size: 12px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Elite Events. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            <a href="${TERMS_URL}" style="color: #aaa; text-decoration: none;">Terms & Conditions</a> |
                            <a href="${PRIVACY_URL}" style="color: #aaa; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      TARGET_EMAIL_FOR_ALL_MAILS,
      'Elite Events: Welcome to Elite Events!',
      `Dear ${user.name},\n\nWelcome to Elite Events! Your account has been successfully created and activated. You can now log in.\n\nThank you!`,
      welcomeHtmlContent
    );
    console.log(`Welcome email sent to ${TARGET_EMAIL_FOR_ALL_MAILS}`);

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

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    console.error("Error during user login:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

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
      console.warn(`Password reset requested for non-existent or inactive email: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    if (user.status !== 'active') {
      return res.status(400).json({ message: 'Account is not active. Please activate your account first.' });
    }

    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    await user.save();

    const otpHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4CAF50; padding: 20px 0; color: #ffffff;">
                <tr>
                    <td align="center" style="padding-bottom: 10px;">
                        <img src="${LOGO_URL}" alt="Elite Events Logo" style="height: 50px; display: block; margin: 0 auto;">
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 5px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Elite Events</h1>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Hello ${user.name},</p>
                        <p style="font-size: 16px;">You have requested a password reset for your Elite Events account.</p>
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
                    <td align="center" style="padding: 10px 20px;">
                        <p style="font-size: 12px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Elite Events. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            <a href="${TERMS_URL}" style="color: #aaa; text-decoration: none;">Terms & Conditions</a> |
                            <a href="${PRIVACY_URL}" style="color: #aaa; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      TARGET_EMAIL_FOR_ALL_MAILS,
      'Elite Events: Your Password Reset OTP',
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

    if (user.otpExpiry < new Date()) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new password reset.' });
    }

    if (user.otpAttempts >= MAX_RESET_OTP_ATTEMPTS) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: `Maximum OTP attempts (${MAX_RESET_OTP_ATTEMPTS}) exceeded. Please request a new password reset.` });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      const attemptsLeft = MAX_RESET_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({ message: `Invalid OTP. Attempts left: ${attemptsLeft}.` });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    const securityHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4CAF50; padding: 20px 0; color: #ffffff;">
                <tr>
                    <td align="center" style="padding-bottom: 10px;">
                        <img src="${LOGO_URL}" alt="Elite Events Logo" style="height: 50px; display: block; margin: 0 auto;">
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 5px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Elite Events</h1>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <p style="font-size: 16px;">Dear ${user.name},</p>
                        <p style="font-size: 16px;">This is a confirmation that the password for your Elite Events account (<strong>${user.email}</strong>) has been successfully reset.</p>
                        <p style="font-size: 16px;">If you did not initiate this password reset, please contact our support team immediately.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="YOUR_FRONTEND_LOGIN_URL" style="background-color: #0288d1; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">Login to Your Account</a>
                        </p>
                    </td>
                </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px 0; border-top: 1px solid #eee;">
                <tr>
                    <td align="center" style="padding: 10px 20px;">
                        <p style="font-size: 12px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Elite Events. All rights reserved.</p>
                        <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            <a href="${TERMS_URL}" style="color: #aaa; text-decoration: none;">Terms & Conditions</a> |
                            <a href="${PRIVACY_URL}" style="color: #aaa; text-decoration: none;">Privacy Policy</a>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    await sendEmail(
      TARGET_EMAIL_FOR_ALL_MAILS,
      'Elite Events: Your Password Has Been Reset',
      `Dear ${user.name},\n\nYour password for Elite Events account ${user.email} has been successfully reset.`,
      securityHtmlContent
    );
    console.log(`Password reset security email sent to ${TARGET_EMAIL_FOR_ALL_MAILS}`);

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

/**
 * @desc    Update user profile (name, dob)
 * @route   PUT /api/auth/profile
 * @access  Private (Authenticated user)
 * @body    { name, dob }
 */
async function updateUserProfile(req, res) {
  const userId = req.user._id;
  const { name, dob } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) {
      user.name = name;
    }
    if (dob) {
      user.dob = new Date(dob);
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/request-password-reset-otp', requestPasswordResetOtp);
router.post('/reset-password', resetPassword);
router.put('/profile', authMiddleware, updateUserProfile);

module.exports = router;