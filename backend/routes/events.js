// routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Events');
const Booking = require('../models/Booking');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const sendEmail = require('../utils/email');

const TARGET_EMAIL_FOR_ALL_MAILS = "22311a0563@cse.sreenidhi.edu.in";
const LOGO_URL = "https://www.dpsnacharam.in/assets/images/Homepage_Logos/dps-nc-white-logo.png"; // Placeholder, replace with your hosted logo URL
const TERMS_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-terms-conditions-agreement.pdf";   // Replace with your actual T&C URL
const PRIVACY_URL = "https://www.termsfeed.com/public/uploads/2021/12/sample-privacy-policy-template.pdf";  


// --- Event Controller Functions ---

// 1. Get All Events
async function getAllEvents(req, res) {
  try {
    const query = {};

    if(req.query.keyword){
        const keyword = req.query.keyword;
        query.$or = [ {eventName: {$regex: keyword, $options: 'i'}}, {description: {$regex: keyword, $options: 'i'}} ];
    }

    if(req.query.category){
        const category = req.query.category;
        query.category = category;
    }

    if (req.query.startDate || req.query.endDate) {
      query.eventDate = {};
      if (req.query.startDate) {
        query.eventDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query.eventDate.$lt = endDate;
      }
    }

    const { page = 1, limit = 10 } = req.query;
    const count = await Event.countDocuments(query);
    const events = await Event.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ eventDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      totalEvents: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 6. Get authorized events (Organizer's own events)
async function getOrganizerEvents(req, res){
  try {
    const organizerId = req.user.id;
    const currentDate = new Date();

    const events = await Event.find({
      organizer: organizerId,
      eventDate: { $gte: currentDate }
    }).sort({ eventDate: 1 });

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({ message: 'Server error. Could not fetch events.' });
  }
}


// 2. Get Single Event by ID
async function getEventById(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 3. Create New Event
async function createEvent(req, res) {
  try {
    const { eventName, description, eventDate, startTime, endTime, category, totalCapacity, location, relatedLinks, eventPrice } = req.body;

    const event = new Event({
      eventName,
      description,
      eventDate,
      startTime,
      endTime,
      category,
      totalCapacity,
      availableCapacity: totalCapacity,
      bookedCapacity: 0,
      location,
      relatedLinks,
      eventPrice,
      organizer: req.user.id,
    });

    await event.save();
    res.status(201).json({ success: true, message: 'Event created successfully!', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 4. Update Event by ID
async function updateEvent(req, res) {
  try {
    const { eventName, description, eventDate, startTime, endTime, category, totalCapacity, location, relatedLinks, eventPrice } = req.body;

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event.' });
    }

    const originalEventDetails = {
      eventName: event.eventName,
      eventDate: event.eventDate ? event.eventDate.toISOString() : null,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      eventPrice: event.eventPrice,
    };

    const changes = {};
    if (eventName && eventName !== originalEventDetails.eventName) changes.eventName = eventName;
    if (eventDate && new Date(eventDate).toISOString() !== originalEventDetails.eventDate) changes.eventDate = eventDate;
    if (startTime && startTime !== originalEventDetails.startTime) changes.startTime = startTime;
    if (endTime && endTime !== originalEventDetails.endTime) changes.endTime = endTime;
    if (location && location !== originalEventDetails.location) changes.location = location;
    if (eventPrice && eventPrice !== originalEventDetails.eventPrice) changes.eventPrice = eventPrice;

    Object.assign(event, req.body);
    if (totalCapacity !== undefined && event.totalCapacity !== totalCapacity) {
        const capacityDifference = totalCapacity - event.totalCapacity;
        event.availableCapacity += capacityDifference;
        event.totalCapacity = totalCapacity;
    }
    await event.save();

    if (Object.keys(changes).length > 0) {
      const confirmedBookings = await Booking.find({ event: event._id, status: 'confirmed' }).populate('user');
      for (const booking of confirmedBookings) {
        let changeHtml = '';
        for (const key in changes) {
            const oldValue = originalEventDetails[key];
            const newValue = changes[key];
            changeHtml += `<tr>
                                <td style="padding: 5px 0; color: #666;"><strong>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</strong></td>
                                <td style="padding: 5px 0;">${key.includes('Date') ? new Date(oldValue).toLocaleDateString() : oldValue}</td>
                                <td style="padding: 5px 0;">&#8594;</td>
                                <td style="padding: 5px 0;">${key.includes('Date') ? new Date(newValue).toLocaleDateString() : newValue}</td>
                            </tr>`;
        }
        const updateHtmlContent = `
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
                            <p style="font-size: 16px;">Dear ${booking.user.name},</p>
                            <p style="font-size: 16px;">There have been updates to the event "<strong>${event.eventName}</strong>" that you have booked.</p>
                            <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Updated Details:</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                                ${changeHtml}
                            </table>
                            <p style="font-size: 16px; margin-top: 20px;">Please review the updated details. We look forward to seeing you there!</p>
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
        const subject = `Elite Events: Event Update - ${event.eventName}`;
        await sendEmail(
          TARGET_EMAIL_FOR_ALL_MAILS,
          subject,
          "t",
           updateHtmlContent,
        );
      }
    }

    res.status(200).json({ success: true, message: 'Event updated successfully!', event });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 5. Delete Event by ID
async function deleteEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event.' });
    }

    const confirmedBookings = await Booking.find({ event: event._id, status: 'confirmed' }).populate('user');

    for (const booking of confirmedBookings) {
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
                            <p style="font-size: 16px;">Dear ${booking.user.name},</p>
                            <p style="font-size: 16px;">We regret to inform you that the event "<strong>${event.eventName}</strong>" scheduled for ${new Date(event.eventDate).toLocaleDateString()} at ${event.location} has been cancelled by the organizer.</p>
                            <p style="font-size: 16px;">Your booking (ID: ${booking._id}) for ${booking.numberOfTickets} tickets has been automatically cancelled.</p>
                            <p style="font-size: 16px;">We apologize for any inconvenience this may cause.</p>
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
        await sendEmail({
          email: TARGET_EMAIL_FOR_ALL_MAILS,
          subject: `Elite Events: Event Cancellation - ${event.eventName}`,
          html: cancellationHtmlContent,
        });
      }

    await Booking.deleteMany({ event: event._id });
    await event.deleteOne();

    res.status(200).json({ success: true, message: 'Event deleted successfully and attendees notified.' });
  } catch (error) {
    console.error("Error deleting event:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 7. Send reminder emails to confirmed attendees of an event
async function sendReminder(req, res) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to send reminders for this event.' });
    }

    const confirmedBookings = await Booking.find({ event: event._id, status: 'confirmed' }).populate('user');

    if (confirmedBookings.length === 0) {
      return res.status(200).json({ success: true, message: 'No confirmed attendees to send reminders to.' });
    }

    for (const booking of confirmedBookings) {
      const reminderHtmlContent = `
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
                            <p style="font-size: 16px;">Dear ${booking.user.name},</p>
                            <p style="font-size: 16px;">Just a friendly reminder about the upcoming event you've booked:</p>
                            <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Event Details:</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                                <tr><td style="padding: 5px 0; color: #666;"><strong>Event Name:</strong></td><td style="padding: 5px 0;">${event.eventName}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><strong>Date:</strong></td><td style="padding: 5px 0;">${new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><strong>Time:</strong></td><td style="padding: 5px 0;">${event.startTime} - ${event.endTime}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;"><strong>Location:</strong></td><td style="padding: 5px 0;">${event.location}</td></tr>
                            </table>
                            <p style="font-size: 16px; margin-top: 20px;">We look forward to seeing you there!</p>
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
           `Elite Events: Reminder - ${event.eventName} is Coming Soon!`,
           "Test",
           reminderHtmlContent
        );
      }

    res.status(200).json({ success: true, message: 'Reminder emails sent to all confirmed attendees.' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 8. Get all attendees for a specific event
async function getAttendees(req, res) {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view attendees for this event.' });
    }

    const bookings = await Booking.find({ event: eventId, status: 'confirmed' })
                                  .populate('user', 'name email dob');

    const attendeesList = [];
    bookings.forEach(booking => {
      booking.tickets.forEach(ticket => {
        if (ticket.status === 'active' || ticket.status === 'scanned') {
          attendeesList.push({
            bookingId: booking._id,
            attendeeName: booking.user.name,
            attendeeEmail: booking.user.email,
            attendeeDob: booking.user.dob,
            uniqueTicketId: ticket.uniqueTicketId,
            ticketStatus: ticket.status,
            bookingDate: booking.createdAt,
            totalPrice: booking.totalPrice,
            numberOfTicketsInBooking: booking.numberOfTickets
          });
        }
      });
    });

    res.status(200).json({
      eventName: event.eventName,
      eventId: event._id,
      totalAttendees: attendeesList.length,
      attendees: attendeesList,
    });

  } catch (error) {
    console.error('Error fetching attendees for event:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    res.status(500).json({ message: 'Server error. Could not fetch attendees.', error: error.message });
  }
}

/**
 * @desc    Scan and verify an individual ticket QR code
 * @route   POST /api/event/:eventId/scan-ticket
 * @access  Private (Organizer)
 */
async function scanTicket(req, res, next) {
  const { eventId } = req.params;
  const { uniqueTicketId } = req.body;
  const organizerId = req.user.id;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    if (event.organizer.toString() !== organizerId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to scan tickets for this event.' });
    }

    const booking = await Booking.findOne({
      event: eventId,
      'tickets.uniqueTicketId': uniqueTicketId,
      status: 'confirmed'
    }).populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ticket not found or not valid for this event.' });
    }

    const scannedTicket = booking.tickets.find(
      (ticket) => ticket.uniqueTicketId === uniqueTicketId
    );

    if (!scannedTicket) {
      return res.status(404).json({ success: false, message: 'Ticket details not found within booking.' });
    }

    if (scannedTicket.status === 'scanned') {
      return res.status(400).json({ success: false, message: 'Ticket has already been scanned.' });
    }

    if (scannedTicket.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Ticket has been cancelled.' });
    }

    scannedTicket.status = 'scanned';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Ticket successfully scanned!',
      ticketDetails: {
        uniqueTicketId: scannedTicket.uniqueTicketId,
        bookingId: booking._id,
        eventName: event.eventName,
        attendeeName: booking.user.name,
        attendeeEmail: booking.user.email,
        scannedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Event ID format.' });
    }
    next(error);
  }
}


// --- Event Routes ---

router.get('/', getAllEvents);
router.get('/my-events', authMiddleware, authorizeRole(['organizer']), getOrganizerEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, authorizeRole(['organizer']), createEvent);
router.put('/:id', authMiddleware, authorizeRole(['organizer']), updateEvent);
router.delete('/:id', authMiddleware, authorizeRole(['organizer']), deleteEvent);
router.post('/:id/send-reminder', authMiddleware, authorizeRole(['organizer']), sendReminder);
router.get('/:id/attendees', authMiddleware, authorizeRole(['organizer']), getAttendees);
router.post('/:eventId/scan-ticket', authMiddleware, authorizeRole(['organizer']), scanTicket);


module.exports = router;