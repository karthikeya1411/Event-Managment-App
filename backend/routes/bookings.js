// routes/bookings.js
const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Events');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const sendEmail = require('../utils/email');
const { generateOTP, setOTPExpiry } = require('../utils/otpGenerator');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const TARGET_EMAIL_FOR_ALL_MAILS = "22311a0563@cse.sreenidhi.edu.in";
const LOGO_URL = "https://www.dpsnacharam.in/assets/images/Homepage_Logos/dps-nc-white-logo.png"; // Placeholder, replace with your hosted logo URL
const TERMS_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-terms-conditions-agreement.pdf";   // Replace with your actual T&C URL
const PRIVACY_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-privacy-policy-template.pdf";     // Replace with your actual Privacy Policy URL


/**
 * @desc    Initiate a booking (creates pending booking and sends OTP)
 * Capacity is NOT decremented at this stage.
 * @route   POST /api/bookings/initiate-booking
 * @access  Private (Attendee only)
 */
async function initiateBooking(req, res, next) {
  const userId = req.user._id;
  const userEmail = req.user.email;
  const { eventId, numberOfTickets } = req.body;

  if (!eventId || !numberOfTickets || numberOfTickets < 1) {
    return res.status(400).json({ message: 'Event ID and number of tickets are required, and tickets must be at least 1.' });
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const currentAvailableCapacity = (event.availableCapacity !== undefined) ? event.availableCapacity : (event.totalCapacity - event.bookedCapacity);

    if (currentAvailableCapacity < numberOfTickets) {
      return res.status(400).json({ message: `Not enough tickets available. Only ${currentAvailableCapacity} left for '${event.eventName}'.` });
    }

    const totalPrice = event.eventPrice * numberOfTickets;

    const booking = new Booking({
      user: userId,
      event: eventId,
      numberOfTickets,
      totalPrice,
      status: 'pending_confirmation',
    });

    await booking.save();

    const otp = generateOTP();
    const otpRecord = new OTP({
      userId: userId,
      otp,
      bookingId: booking._id,
      action: 'confirm_booking',
      expiresAt: setOTPExpiry()
    });
    await otpRecord.save();

    const user = await User.findById(userId);
    const otpHtmlContent = 
    `
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
                        <p style="font-size: 16px;">You've initiated a booking for "<strong>${event.eventName}</strong>".</p>
                        <p style="font-size: 16px;">Your One-Time Password to confirm this booking is:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; background-color: #f0f8f0; padding: 10px; border-radius: 5px;">${otp}</p>
                        <p style="font-size: 16px;">This OTP is valid for 10 minutes.</p>
                        <p style="font-size: 16px;">Please use Booking ID: <strong>${booking._id}</strong> for confirmation.</p>
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
      'Elite Events: Confirm Your Event Booking - OTP',
      "TYr",
       otpHtmlContent,
    );

    res.status(200).json({
      success: true,
      message: 'Booking initiated. OTP sent to your email for confirmation.',
      bookingId: booking._id,
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
}

/**
 * @desc    Initiate booking cancellation (flags pending cancellation and sends OTP)
 * @route   POST /api/bookings/initiate-cancellation
 * @access  Private (Attendee only)
 */
async function initiateCancellation(req, res, next) {
  const userId = req.user._id;
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate('event');

    if (!booking || booking.user.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized.' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be cancelled.' });
    }

    const otp = generateOTP();
    const otpRecord = new OTP({
      userId: userId,
      otp,
      bookingId: booking._id,
      action: 'confirm_cancel',
      expiresAt: setOTPExpiry()
    });
    await otpRecord.save();

    const user = await User.findById(userId);
    const emailSubject = 'Elite Events: Cancel Your Event Booking - OTP';
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
                        <p style="font-size: 16px;">Dear ${user.name},</p>
                        <p style="font-size: 16px;">You've requested to cancel your booking for "<strong>${booking.event.eventName}</strong>".</p>
                        <p style="font-size: 16px;">Your One-Time Password to confirm this cancellation is:</p>
                        <p style="font-size: 28px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; background-color: #f0f8f0; padding: 10px; border-radius: 5px;">${otp}</p>
                        <p style="font-size: 16px;">This OTP is valid for 10 minutes.</p>
                        <p style="font-size: 16px;">Please use Booking ID: <strong>${booking._id}</strong> for confirmation.</p>
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
    //console.log(otpHtmlContent);
    await sendEmail(
      TARGET_EMAIL_FOR_ALL_MAILS,
      emailSubject,
      "T",
      otpHtmlContent,
    );

    res.status(200).json({
      success: true,
      message: 'Cancellation initiated. OTP sent to your email for confirmation.',
      bookingId: booking._id,
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
}

/**
 * @desc    Verify OTP and proceed with booking or cancellation
 * @route   POST /api/bookings/verify-otp
 * @access  Private (Attendee)
 */
async function verifyOtpAndProceed(req, res, next) {
  const { otp, actionType, bookingId } = req.body;
  const userId = req.user._id;

  try {
    const otpRecord = await OTP.findOne({ otp, userId: userId });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const booking = await Booking.findById(bookingId).populate('event');

    if (!booking || booking.user.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized.' });
    }

    if (actionType === 'confirm_booking') {
      if (booking.status !== 'pending_confirmation') {
        return res.status(400).json({ success: false, message: 'Booking is not in pending confirmation status.' });
      }

      const event = await Event.findById(booking.event._id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }

      const currentAvailableCapacity = (event.availableCapacity !== undefined) ? event.availableCapacity : (event.totalCapacity - event.bookedCapacity);

      if (currentAvailableCapacity < booking.numberOfTickets) {
        return res.status(400).json({ success: false, message: `Not enough tickets available. Only ${currentAvailableCapacity} left for this event.` });
      }

      if (event.availableCapacity !== undefined) {
          event.availableCapacity -= booking.numberOfTickets;
      }
      event.bookedCapacity += booking.numberOfTickets;
      await event.save();

      const individualTickets = [];
      for (let i = 0; i < booking.numberOfTickets; i++) {
        const uniqueTicketId = uuidv4();
        const qrCodeDataUrl = await qrcode.toDataURL(uniqueTicketId);

        individualTickets.push({
          uniqueTicketId,
          qrCodeDataUrl,
          status: 'active',
        });
      }
      booking.tickets = individualTickets;

      booking.status = 'confirmed';
      await booking.save();

      await OTP.findByIdAndDelete(otpRecord._id);

      const user = await User.findById(userId);
      const emailSubject = 'Elite Events: Your Event Booking Confirmation & Tickets!';

      let qrHtml = '';
      booking.tickets.forEach((ticket, index) => {
        qrHtml += `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
            <h3 style="color: #333; margin-top: 0;">Ticket ${index + 1} for ${booking.event.eventName}</h3>
            <p style="font-size: 14px; color: #555;">Ticket ID: <strong>${ticket.uniqueTicketId}</strong></p>
            <p style="font-size: 14px; color: #555;">Event Date: ${new Date(booking.event.eventDate).toLocaleDateString()} at ${booking.event.startTime}</p>
            <p style="font-size: 14px; color: #555;">Location: ${booking.event.location}</p>
            <img src="${ticket.qrCodeDataUrl}" alt="QR Code for Ticket ${index + 1}" style="width: 180px; height: 180px; display: block; margin: 15px auto; border: 1px solid #ddd; border-radius: 4px;">
            <p style="font-size: 12px; color: #777; text-align: center;">Please present this QR code at the event entrance.</p>
          </div>
        `;
      });

      const emailMessage = `
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
                        <p style="font-size: 16px;">Your booking for "<strong>${booking.event.eventName}</strong>" has been successfully confirmed!</p>
                        <p style="font-size: 14px; color: #666;">Booking ID: <strong>${booking._id}</strong></p>
                        <p style="font-size: 14px; color: #666;">Number of Tickets: <strong>${booking.numberOfTickets}</strong></p>
                        <p style="font-size: 14px; color: #666;">Total Price: <strong>$${booking.totalPrice.toFixed(2)}</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Your Tickets:</h3>
                        ${qrHtml}
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 20px;">
                        <p style="font-size: 14px; color: #777;">We look forward to seeing you at the event!</p>
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
         emailSubject,
        "T",
         emailMessage,
      );

      res.status(200).json({
        success: true,
        message: 'Booking confirmed successfully! Tickets sent to your email.',
        booking,
        eventAvailableCapacity: event.availableCapacity,
      });

    } else if (actionType === 'confirm_cancel') {
      if (booking.status !== 'pending_confirmation' && booking.status !== 'confirmed') {
        return res.status(400).json({ success: false, message: 'Booking cannot be cancelled from its current status.' });
      }

      if (booking.status === 'confirmed') {
        const event = await Event.findById(booking.event._id);
        if (event) {
          if (event.availableCapacity !== undefined) {
              event.availableCapacity += booking.numberOfTickets;
          }
          event.bookedCapacity -= booking.numberOfTickets;
          await event.save();
        }
      }

      booking.status = 'cancelled';
      booking.tickets.forEach(ticket => {
        ticket.status = 'cancelled';
      });
      await booking.save();

      await OTP.findByIdAndDelete(otpRecord._id);

      const user = await User.findById(userId);
      const cancellationHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
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
                        <p style="font-size: 16px;">Your booking for the event "<strong>${booking.event.eventName}</strong>" has been successfully cancelled.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Cancellation Details</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                            <tr>
                                <td style="padding: 8px 0; width: 30%; color: #666;"><strong>Event:</strong></td>
                                <td style="padding: 8px 0; width: 70%;">${booking.event.eventName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                                <td style="padding: 8px 0;">${booking._id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Tickets Cancelled:</strong></td>
                                <td style="padding: 8px 0;">${booking.numberOfTickets}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 20px;">
                        <p style="font-size: 14px; color: #777;">We hope to see you at another event soon!</p>
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
         'Elite Events: Booking Cancellation Confirmed',
         "T",
         cancellationHtmlContent,
      );

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
      });

    } else {
      return res.status(400).json({ success: false, message: 'Invalid actionType.' });
    }

  } catch (error) {
    console.error(error);
    next(error);
  }
}
// const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// async function generateTicketsPdf(tickets, event, user) {
//   // Create a new PDFDocument
//   const pdfDoc = await PDFDocument.create();

//   // Embed fonts
//   const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//   for (let i = 0; i < tickets.length; i++) {
//     const ticket = tickets[i];

//     // Add a page per ticket
//     const page = pdfDoc.addPage([400, 550]);
//     const { width, height } = page.getSize();

//     // Draw background (light grey)
//     page.drawRectangle({
//       x: 20,
//       y: 20,
//       width: width - 40,
//       height: height - 40,
//       color: rgb(0.95, 0.95, 0.95),
//       borderColor: rgb(0.6, 0.6, 0.6),
//       borderWidth: 1,
//       borderRadius: 15,
//     });

//     // Header text: Event name
//     page.drawText(`Elite Events Ticket #${i + 1}`, {
//       x: 40,
//       y: height - 60,
//       size: 20,
//       font: fontHelveticaBold,
//       color: rgb(0.15, 0.55, 0.15),
//     });

//     page.drawText(event.eventName, {
//       x: 40,
//       y: height - 90,
//       size: 16,
//       font: fontHelvetica,
//       color: rgb(0, 0, 0),
//     });

//     // Ticket details (Ticket ID, Date, Location, User)
//     const detailsYStart = height - 130;
//     const lineHeight = 20;

//     page.drawText(`Ticket ID:`, { x: 40, y: detailsYStart, size: 12, font: fontHelveticaBold });
//     page.drawText(ticket.uniqueTicketId, { x: 110, y: detailsYStart, size: 12, font: fontHelvetica });

//     page.drawText(`Event Date:`, { x: 40, y: detailsYStart - lineHeight, size: 12, font: fontHelveticaBold });
//     page.drawText(new Date(event.eventDate).toLocaleDateString(), { x: 110, y: detailsYStart - lineHeight, size: 12, font: fontHelvetica });

//     page.drawText(`Start Time:`, { x: 40, y: detailsYStart - 2 * lineHeight, size: 12, font: fontHelveticaBold });
//     page.drawText(event.startTime, { x: 110, y: detailsYStart - 2 * lineHeight, size: 12, font: fontHelvetica });

//     page.drawText(`Location:`, { x: 40, y: detailsYStart - 3 * lineHeight, size: 12, font: fontHelveticaBold });
//     page.drawText(event.location, { x: 110, y: detailsYStart - 3 * lineHeight, size: 12, font: fontHelvetica });

//     page.drawText(`Name:`, { x: 40, y: detailsYStart - 4 * lineHeight, size: 12, font: fontHelveticaBold });
//     page.drawText(user.name, { x: 110, y: detailsYStart - 4 * lineHeight, size: 12, font: fontHelvetica });

//     // Generate QR code PNG buffer for this ticket
//     const qrPngBuffer = await qrcode.toBuffer(ticket.uniqueTicketId, { width: 180, margin: 1 });

//     // Embed QR code image into PDF
//     const qrImage = await pdfDoc.embedPng(qrPngBuffer);

//     const qrDims = qrImage.scale(0.5);
//     page.drawImage(qrImage, {
//       x: width / 2 - qrDims.width / 2,
//       y: 80,
//       width: qrDims.width,
//       height: qrDims.height,
//     });

//     // Footer text
//     page.drawText('Please present this QR code at the event entrance.', {
//       x: 40,
//       y: 50,
//       size: 10,
//       font: fontHelvetica,
//       color: rgb(0.4, 0.4, 0.4),
//     });
//   }

//   const pdfBytes = await pdfDoc.save();
//   return pdfBytes;
// }

// async function verifyOtpAndProceed(req, res, next) {
//   const { otp, actionType, bookingId } = req.body;
//   const userId = req.user._id;

//   try {
//     const otpRecord = await OTP.findOne({ otp, userId });

//     if (!otpRecord || otpRecord.expiresAt < new Date()) {
//       return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
//     }

//     const booking = await Booking.findById(bookingId).populate('event');

//     if (!booking || booking.user.toString() !== userId.toString()) {
//       return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized.' });
//     }

//     if (actionType === 'confirm_booking') {
//       if (booking.status !== 'pending_confirmation') {
//         return res.status(400).json({ success: false, message: 'Booking is not in pending confirmation status.' });
//       }

//       const event = await Event.findById(booking.event._id);
//       if (!event) {
//         return res.status(404).json({ success: false, message: 'Event not found.' });
//       }

//       const currentAvailableCapacity = (event.availableCapacity !== undefined) ? event.availableCapacity : (event.totalCapacity - event.bookedCapacity);

//       if (currentAvailableCapacity < booking.numberOfTickets) {
//         return res.status(400).json({ success: false, message: `Not enough tickets available. Only ${currentAvailableCapacity} left.` });
//       }

//       if (event.availableCapacity !== undefined) {
//         event.availableCapacity -= booking.numberOfTickets;
//       }
//       event.bookedCapacity += booking.numberOfTickets;
//       await event.save();

//       // Generate tickets with unique IDs
//       const individualTickets = [];
//       for (let i = 0; i < booking.numberOfTickets; i++) {
//         individualTickets.push({
//           uniqueTicketId: uuidv4(),
//           status: 'active',
//         });
//       }

//       booking.tickets = individualTickets;
//       booking.status = 'confirmed';
//       await booking.save();

//       await OTP.findByIdAndDelete(otpRecord._id);

//       const user = await User.findById(userId);

//       // Generate PDF buffer with tickets and QR codes
//       const pdfBuffer = await generateTicketsPdf(booking.tickets, event, user);

//       // Email HTML message
//       const emailMessage = `
//         <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #4CAF50;">Your Elite Events Booking Confirmation</h2>
//           <p>Dear ${user.name},</p>
//           <p>Your booking for <strong>${event.eventName}</strong> has been confirmed successfully.</p>
//           <p>Booking ID: <strong>${booking._id}</strong></p>
//           <p>Number of Tickets: <strong>${booking.numberOfTickets}</strong></p>
//           <p>Total Price: <strong>$${booking.totalPrice.toFixed(2)}</strong></p>
//           <p>Please find attached your ticket(s) with QR codes for entry.</p>
//           <p>We look forward to seeing you at the event!</p>
//           <p>Best regards,<br/>Elite Events Team</p>
//         </div>
//       `;

//       // Attach the PDF
//       const attachments = [{
//         filename: `EliteEvents_Tickets_${booking._id}.pdf`,
//         content: pdfBuffer,
//         contentType: 'application/pdf',
//       }];

//       await sendEmail(
//         TARGET_EMAIL_FOR_ALL_MAILS,
//         'Elite Events: Your Booking Confirmation & Tickets',
//         "T",
//         emailMessage,
//         attachments
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Booking confirmed successfully! Tickets PDF sent to your email.',
//         booking,
//         eventAvailableCapacity: event.availableCapacity,
//       });

//     } else if (actionType === 'confirm_cancel') {
//       // Your existing cancel logic...
//     } else {
//       return res.status(400).json({ success: false, message: 'Invalid actionType.' });
//     }

//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// }

/**
 * @desc    Get all bookings for the authenticated user (requires attendee role)
 * @route   GET /api/booking/my
 * @access  Private (Attendee)
 */
async function getUserBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('event');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

/**
 * @desc    Route for organizers to view the bookings of their events
 * @route   GET /api/booking/event/:id/getDetails
 * @access  Private (Organizer)
 */
async function getEventBookings(req, res, next) {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view bookings for this event.' });
    }

    const bookings = await Booking.find({ event: eventId, status: 'confirmed' })
                                  .populate('user', 'name email dob');

    const formattedBookings = bookings.map(booking => ({
        bookingId: booking._id,
        attendeeName: booking.user.name,
        attendeeEmail: booking.user.email,
        attendeeDob: booking.user.dob,
        numberOfTickets: booking.numberOfTickets,
        bookingDate: booking.createdAt,
        totalPrice: booking.totalPrice,
        tickets: booking.tickets.map(ticket => ({
            uniqueTicketId: ticket.uniqueTicketId,
            status: ticket.status,
            qrCodeDataUrl: ticket.qrCodeDataUrl
        }))
    }));

    res.status(200).json({
      success: true,
      eventName: event.eventName,
      eventId: event._id,
      totalBookings: formattedBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// Route to cancel a booking (Your existing function)
async function cancelBooking(req, res, next) {
  const bookingId = req.params.id;
  const userId = req.user._id;

  try {
    const booking = await Booking.findById(bookingId).populate('event');

    if (!booking || booking.user.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Booking not found or not authorized to cancel.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    if (booking.status !== 'confirmed') {
        return res.status(400).json({message: "Booking cannot be cancelled from its current state. Please use OTP flow if it's pending."});
    }

    const event = await Event.findById(booking.event._id);
    if (event) {
        if (event.availableCapacity !== undefined) {
            event.availableCapacity += booking.numberOfTickets;
        }
        event.bookedCapacity -= booking.numberOfTickets;
        await event.save();
    }

    booking.status = 'cancelled';
    booking.tickets.forEach(ticket => {
        ticket.status = 'cancelled';
    });
    await booking.save();

    const user = await User.findById(userId);
    const cancellationHtmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
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
                        <p style="font-size: 16px;">Your booking for the event "<strong>${booking.event.eventName}</strong>" has been successfully cancelled.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Cancellation Details</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                            <tr>
                                <td style="padding: 8px 0; width: 30%; color: #666;"><strong>Event:</strong></td>
                                <td style="padding: 8px 0; width: 70%;">${booking.event.eventName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                                <td style="padding: 8px 0;">${booking._id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Tickets Cancelled:</strong></td>
                                <td style="padding: 8px 0;">${booking.numberOfTickets}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding-top: 20px;">
                        <p style="font-size: 14px; color: #777;">We hope to see you at another event soon!</p>
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
      'Elite Events: Booking Cancellation Confirmation',
      "T",
       cancellationHtmlContent,
    );

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.', booking });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    next(error);
  }
}


// --- Booking Routes ---

router.post('/initiate-booking', authMiddleware, authorizeRole(['attendee']), initiateBooking);
router.post('/initiate-cancellation', authMiddleware, authorizeRole(['attendee']), initiateCancellation);
router.post('/verify-otp', authMiddleware, authorizeRole(['attendee']), verifyOtpAndProceed);
router.get('/my', authMiddleware, authorizeRole(['attendee']), getUserBookings);
router.get('/event/:id/getDetails', authMiddleware, authorizeRole(['organizer']), getEventBookings);
router.post('/:id/cancel', authMiddleware, authorizeRole(['attendee']), cancelBooking);

module.exports = router;