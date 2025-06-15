// routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Events'); // We need the Event model to update capacity and fetch price
const authMiddleware = require('../middleware/auth'); // For verifying JWT and attaching user info
const authorizeRole = require('../middleware/authorizeRole'); // For role-based access control
const sendEmail = require('../utils/email'); // Import your email utility
const { generateOTP, setOTPExpiry } = require('../utils/otpGenerator'); // Import OTP utility
const qrcode = require('qrcode');

async function initiateBooking(req, res) {
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
    if (event.availableCapacity < numberOfTickets) {
      return res.status(400).json({ message: `Not enough tickets available. Only ${event.availableCapacity} left for '${event.eventName}'.` });
    }

    const totalPrice = event.eventPrice * numberOfTickets;

    // Create the booking in a pending_confirmation state
    const newBooking = new Booking({
      user: userId,
      event: eventId,
      numberOfTickets,
      status: 'pending_confirmation', // Set status to pending
      totalPrice,
    });
    await newBooking.save(); // Save the pending booking

    // Decrement capacity *after* saving pending booking
    // This reduces race conditions, but a scheduled cleanup might be needed for abandoned pending bookings
    event.availableCapacity -= numberOfTickets;
    await event.save();

    // Generate and store OTP in user's document
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    const user = req.user;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendEmail(
      userEmail,
      'Confirm Your Event Booking',
      `You've initiated a booking for '${event.eventName}'. Your One-Time Password to confirm is: ${otp}. This OTP is valid for 10 minutes. Please use Booking ID: ${newBooking._id}`,
      `<p>You've initiated a booking for <strong>${event.eventName}</strong>.</p>
       <p>Your One-Time Password to confirm this booking is: <strong>${otp}</strong></p>
       <p>This OTP is valid for 10 minutes.</p>
       <p>Please use Booking ID: <strong>${newBooking._id}</strong> for confirmation.</p>`
    );

    res.status(202).json({ // 202 Accepted, as the action is pending confirmation
      message: 'Booking initiated. OTP sent to your email for confirmation.',
      bookingId: newBooking._id // Return the pending booking ID
    });

  } catch (error) {
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    console.error('Error initiating booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function initiateCancellation(req, res) {
  const userId = req.user._id;
  const userEmail = req.user.email;
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required.' });
  }

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to cancel this booking.' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }
    if (booking.status === 'pending_confirmation') {
      return res.status(400).json({ message: 'Booking is still pending confirmation. Cannot cancel before it is confirmed.' });
    }

    // Generate and store OTP in user's document
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    const user = req.user;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email for cancellation
    await sendEmail(
      userEmail,
      'Confirm Booking Cancellation',
      `You've requested to cancel your booking for Event ID: ${booking.event}. Your One-Time Password to confirm cancellation is: ${otp}. This OTP is valid for 10 minutes. Please use Booking ID: ${booking._id}`,
      `<p>You've requested to cancel your booking for Event ID: <strong>${booking.event}</strong>.</p>
       <p>Your One-Time Password to confirm cancellation is: <strong>${otp}</strong></p>
       <p>This OTP is valid for 10 minutes.</p>
       <p>Please use Booking ID: <strong>${booking._id}</strong> for confirmation.</p>`
    );

    res.status(202).json({
      message: 'Cancellation initiated. OTP sent to your email for confirmation.',
      bookingId: booking._id
    });

  } catch (error) {
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ message: 'Invalid Booking ID format.' });
    }
    console.error('Error initiating cancellation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function confirmBookingInternal(userId, bookingId) {
    try {
        const booking = await Booking.findById(bookingId)
                                     .populate('event')
                                     .populate('user');

        // ... (existing error and validation checks)

        booking.status = 'confirmed';
        await booking.save();

        // --- NEW: Generate QR Code and Prepare Attachment ---
        let qrCodeDataUri = '';
        let attachments = [];
        if (booking.user && booking.event) {
            const bookingIdText = booking._id.toString(); // The data for the QR code

            try {
                // Generate QR code as a data URI (base64 encoded image)
                qrCodeDataUri = await qrcode.toDataURL(bookingIdText, {
                    errorCorrectionLevel: 'H', // High error correction
                    type: 'image/png',
                    quality: 0.92,
                    margin: 1,
                    width: 150 // Set a reasonable width for the QR code image
                });

                // Prepare the QR code as an inline attachment
                attachments = [{
                    filename: 'booking_qr_code.png',
                    content: qrCodeDataUri.split('base64,')[1], // Get base64 content
                    encoding: 'base64',
                    cid: 'bookingqrcode' // Content-ID for referencing in HTML
                }];

            } catch (qrError) {
                console.error("Error generating QR code:", qrError);
                // Continue without QR code if generation fails
                qrCodeDataUri = ''; // Clear it to ensure no broken image link
                attachments = [];
            }

            const userEmail = booking.user.email;
            const userName = booking.user.name;
            const eventName = booking.event.eventName;
            const eventDate = new Date(booking.event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const startTime = booking.event.startTime;
            const location = booking.event.location;
            const numberOfTickets = booking.numberOfTickets;
            const totalPrice = booking.totalPrice;

            // --- UPDATED HTML CONTENT TO INCLUDE QR CODE ---
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 20px 0;">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <h1 style="color: #4CAF50; margin: 0;">Booking Confirmed!</h1>
                                <p style="font-size: 16px; color: #555;">Thank you for your booking with us.</p>
                            </td>
                        </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <p style="font-size: 16px;">Dear ${userName},</p>
                                <p style="font-size: 16px;">Your booking for the event "<strong>${eventName}</strong>" has been successfully confirmed!</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Booking Details</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                                    <tr>
                                        <td style="padding: 8px 0; width: 30%; color: #666;"><strong>Event:</strong></td>
                                        <td style="padding: 8px 0; width: 70%;">${eventName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                                        <td style="padding: 8px 0;">${bookingIdText}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                                        <td style="padding: 8px 0;">${eventDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
                                        <td style="padding: 8px 0;">${startTime}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                                        <td style="padding: 8px 0;">${location}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Tickets:</strong></td>
                                        <td style="padding: 8px 0;">${numberOfTickets}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Total Price:</strong></td>
                                        <td style="padding: 8px 0;">$${totalPrice.toFixed(2)}</td>
                                    </tr>
                                    ${qrCodeDataUri ? `
                                    <tr>
                                        <td colspan="2" style="padding-top: 20px; text-align: center;">
                                            <p style="margin-bottom: 10px; color: #555;">Scan this QR code for quick check-in:</p>
                                            <img src="cid:bookingqrcode" alt="Booking QR Code" style="display: block; margin: 0 auto; border: 1px solid #eee;">
                                        </td>
                                    </tr>
                                    ` : ''}
                                    </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-top: 20px;">
                                <p style="font-size: 14px; color: #777;">Thank you for choosing our service!</p>
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
                userEmail,
                `Booking Confirmed: ${eventName}`,
                `Dear ${userName},\n\nYour booking for the event "${eventName}" (Booking ID: ${bookingIdText}) has been successfully confirmed!\n\nEvent: ${eventName}\nDate: ${eventDate}\nTime: ${startTime}\nLocation: ${location}\nTickets: ${numberOfTickets}\nTotal Price: $${totalPrice.toFixed(2)}\n\nScan the QR code in the HTML email for check-in.\n\nThank you for your booking!`,
                htmlContent,
                attachments // <-- Pass the attachments array here
            );
            console.log(`Elegant confirmation email with QR code sent to ${userEmail} for booking ${bookingId}`);
        } else {
            console.warn(`Could not send elegant confirmation email for booking ${bookingId}: User or Event details not populated.`);
        }

        const populatedBooking = await Booking.findById(booking._id)
                                              .populate('user', 'name email')
                                              .populate('event', 'eventName eventDate startTime location eventPrice');
        return {
            booking: populatedBooking,
            eventAvailableCapacity: booking.event.availableCapacity
        };

    } catch (error) {
        // ... (error handling)
        throw error;
    }
}

async function confirmCancellationInternal(userId, bookingId) {
    try {
        const booking = await Booking.findById(bookingId)
                                     .populate('event')
                                     .populate('user');

        // ... (existing error and validation checks remain the same)
        if (!booking) { /* ... */ }
        if (booking.user._id.toString() !== userId.toString()) { /* ... */ }
        if (booking.status === 'cancelled') { /* ... */ }
        if (booking.status === 'pending_confirmation') { /* ... */ }

        booking.status = 'cancelled';

        if (booking.event) {
            booking.event.availableCapacity += booking.numberOfTickets;
            await Promise.all([booking.save(), booking.event.save()]);
        } else {
            console.warn(`Event document could not be populated for booking ${bookingId} during cancellation. Event capacity might not be updated.`);
            await booking.save();
        }

        // --- UPDATED: Send Elegant Cancellation Email ---
        if (booking.user && booking.event) {
            const userEmail = booking.user.email;
            const userName = booking.user.name;
            const eventName = booking.event.eventName;
            const numberOfTickets = booking.numberOfTickets;
            const bookingIdText = booking._id.toString();

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffebee; padding: 20px 0;">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <h1 style="color: #D32F2F; margin: 0;">Booking Cancelled</h1>
                                <p style="font-size: 16px; color: #555;">We regret to see you go.</p>
                            </td>
                        </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <p style="font-size: 16px;">Dear ${userName},</p>
                                <p style="font-size: 16px;">Your booking for the event "<strong>${eventName}</strong>" has been successfully cancelled.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Cancellation Details</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                                    <tr>
                                        <td style="padding: 8px 0; width: 30%; color: #666;"><strong>Event:</strong></td>
                                        <td style="padding: 8px 0; width: 70%;">${eventName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Booking ID:</strong></td>
                                        <td style="padding: 8px 0;">${bookingIdText}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;"><strong>Tickets Cancelled:</strong></td>
                                        <td style="padding: 8px 0;">${numberOfTickets}</td>
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
                            <td align="center">
                                <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Event Management App. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </div>
            `;

            await sendEmail(
                userEmail,
                `Booking Cancellation Confirmed: ${eventName}`, // Subject line
                `Dear ${userName},\n\nYour booking for the event "${eventName}" (Booking ID: ${bookingIdText}) has been successfully cancelled.\n\nNumber of tickets cancelled: ${numberOfTickets}.\n\nWe hope to see you at another event soon!`, // Plain text version
                htmlContent // The elegant HTML version
            );
            console.log(`Elegant cancellation confirmation email sent to ${userEmail} for booking ${bookingId}`);
        } else {
            console.warn(`Could not send elegant cancellation email for booking ${bookingId}: User or Event details not populated.`);
        }
        // --- END UPDATED ---

        return true;

    } catch (error) {
        // ... (error handling)
        throw error;
    }
}
async function verifyOtpAndProceed(req, res) {
  const userId = req.user._id;
  const { otp, actionType, bookingId } = req.body; // Only need bookingId here, as details are in the pending booking
  const user = req.user;

  if (!otp || !actionType || !bookingId) {
    return res.status(400).json({ message: 'OTP, action type, and booking ID are required.' });
  }

  // 1. Check if OTP exists and is valid
  if (!user.otp || user.otp !== otp) {
    // Clear potentially wrong OTP
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  // 2. Check if OTP has expired
  if (user.otpExpiry < new Date()) {
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  // If OTP is valid and not expired, clear it immediately so it cannot be reused
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  try {
    let result;
    if (actionType === 'confirm_booking') {
      result = await confirmBookingInternal(userId, bookingId); // Pass userId and bookingId
      res.status(200).json({ // Changed to 200 OK after confirmation
        message: 'Booking confirmed successfully!',
        booking: result.booking,
        eventAvailableCapacity: result.eventAvailableCapacity
      });

    } else if (actionType === 'confirm_cancel') {
      result = await confirmCancellationInternal(userId, bookingId); // Pass userId and bookingId
      res.status(200).json({ message: 'Booking cancelled successfully.' });

    } else {
      return res.status(400).json({ message: 'Invalid action type for OTP verification.' });
    }

  } catch (error) {
    console.error('Error during OTP verification and action execution:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
}

/**
 * @desc    Create a new booking for an event
 * @route   POST /api/bookings
 * @access  Private (Attendee only)
 */
async function createBooking(req, res) {
  const { eventId, numberOfTickets } = req.body;
  const userId = req.user._id; // The ID of the authenticated user making the booking

  // Basic input validation
  if (!eventId || !numberOfTickets || numberOfTickets < 1) {
    return res.status(400).json({ message: 'Event ID and number of tickets are required, and tickets must be at least 1.' });
  }

  try {
    // 1. Find the event to check capacity and get its price
    const event = await Event.findById(eventId);

    // Check if the event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // 2. Check if there's enough available capacity for the requested tickets
    if (event.availableCapacity < numberOfTickets) {
      return res.status(400).json({ message: `Not enough tickets available. Only ${event.availableCapacity} left for '${event.eventName}'.` });
    }

    // 3. Calculate the total price for this booking
    const totalPrice = event.eventPrice * numberOfTickets;

    // 4. Create the new booking document
    const newBooking = new Booking({
      user: userId,             // Link to the user who booked
      event: eventId,           // Link to the event being booked
      numberOfTickets,
      status: 'confirmed',      // Set initial status
      totalPrice,               // Store the calculated total price
    });

    // 5. Decrement the event's available capacity
    event.availableCapacity -= numberOfTickets;

    // 6. Save both the new booking and the updated event document
    // Using Promise.all for concurrent saving and better performance
    await Promise.all([newBooking.save(), event.save()]);

    // 7. Populate user and event details for a meaningful response
    const populatedBooking = await Booking.findById(newBooking._id)
                                          .populate('user', 'name email') // Get user's name and email
                                          .populate('event', 'eventName eventDate startTime location eventPrice'); // Get relevant event details

    // Send success response
    res.status(201).json({
      message: 'Booking created successfully!',
      booking: populatedBooking,
      eventAvailableCapacity: event.availableCapacity // Show remaining capacity for the event
    });

  } catch (error) {
    // Handle specific Mongoose CastError for invalid IDs
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    console.error("Error creating booking:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

/**
 * @desc    Get all bookings made by the authenticated user
 * @route   GET /api/bookings/my
 * @access  Private (Attendee only)
 */
async function getUserBookings(req, res) {
  const userId = req.user._id; // The ID of the authenticated user

  try {
    // Find all bookings where the 'user' field matches the authenticated user's ID
    // Populate linked documents for comprehensive data
    const bookings = await Booking.find({ user: userId })
                                  .populate('event', 'eventName eventDate startTime location eventPrice') // Get event details
                                  .populate('user', 'name email'); // Get user's name and email (though it's the current user)

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
/**
 * @desc    Cancel a booking
 * @route   GET /api/bookings/:id/cancel
 * @access  Private (Attendee only)
 */

async function cancelBooking(req, res){
    const userID = req.user._id;
    const bookingID = req.params.id;


    try{
        const bookedTicket = await Booking.findById(bookingID).populate('event');
        if(!bookedTicket){
            return res.status(404).json({message: "Booking not found"});
        }

        if(bookedTicket.user.toString() !== userID.toString()){
            console.log(bookedTicket.user.toString(), userID);
            return res.status(403).json({message: "You are not authorized to cancel this booking"});
        }

        bookedTicket.status = "cancelled";
        bookedTicket.event.availableCapacity += bookedTicket.numberOfTickets ;
// Corrected line:
    await Promise.all([bookedTicket.save(), bookedTicket.event.save()]);         
    res.status(200).json({message: "Booking cancelled successfully"});
    }

    catch(error){
        console.log("Error cancelling the booking", error);
        res.status(500).json({ message: 'Server error', error: error.message });

    }
}

/**
 * @desc    Organizer viewing the bookings of their event
 * @route   GET /api/bookings/event/:id/getDetails
 * @access  Private (Ortganizer only)
 */
async function getEventBookings(req, res){
    const userID = req.user._id;
    const eventId = req.params.id;

    try{
        const event = await Event.findById(eventId);
        if(!event){
            return res.status(404).json({message: "Event not found"});
        }
        const eventOwner = event.organizer;
        if(eventOwner.toString() !== userID.toString()){
            return res.status(403).json({message: "You are not authorized to view this event's bookings"});
        }
        const bookings = await Booking.find({event: eventId}).populate('user');
        res.status(200).json({bookings});

    } catch(error){
        console.log("Error fetching event bookings", error);
        res.status(500).json({ message: 'Server error', error: error.message });
        
    }
    
    
}


// --- Booking API Routes ---

//Route for organizers to view the bookings of their events
router.get('/event/:id/getDetails', authMiddleware, authorizeRole(['organizer']), getEventBookings);
//Route to cancel a booking
router.post(
    '/:id/cancel',
    authMiddleware,      // Authenticate the user
    authorizeRole(['attendee']), // Ensure the user has the 'attendee' role
    cancelBooking        // Execute the booking creation logic
);

// POST /api/bookings/initiate-booking - Initiate a booking (creates pending booking and sends OTP)
router.post(
  '/initiate-booking',
  authMiddleware,
  authorizeRole(['attendee']),
  initiateBooking
);

// POST /api/bookings/initiate-cancellation - Initiate booking cancellation (flags pending cancellation and sends OTP)
router.post(
  '/initiate-cancellation',
  authMiddleware,
  authorizeRole(['attendee']),
  initiateCancellation
);

// POST /api/bookings/verify-otp - Verify OTP and confirm booking/cancellation
router.post(
  '/verify-otp',
  authMiddleware,
  authorizeRole(['attendee']),
  verifyOtpAndProceed
);

// Route to get all bookings for the authenticated user (requires attendee role)
router.get(
  '/my',
  authMiddleware,      // Authenticate the user
  authorizeRole(['attendee']), // Ensure the user has the 'attendee' role
  getUserBookings      // Execute the logic to fetch user-specific bookings
);

// You can add more routes here for:
// - Getting a single booking by ID (GET /api/bookings/:id)

module.exports = router;