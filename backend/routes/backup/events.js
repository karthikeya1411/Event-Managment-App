const express = require('express');
const router = express.Router();
const Event = require('../models/Events');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

// --- Event Controller Functions ---
// 1. Get All Events
async function getAllEvents(req, res) {
  try {
    const query = {};

    // 1. Search by keyword
    if(req.query.keyword){
        const keyword = req.query.keyword;
        query.$or = [ {eventName: {$regex: keyword, $options: 'i'}}, {description: {$regex: keyword, $options: 'i'}} ];
    }

    // 2. Filter by category
    if(req.query.category){
        const category = req.query.category;
        query.category = category;
    }

    // 3. Filter by date
        if (req.query.startDate || req.query.endDate) {
      query.eventDate = {};
      if (req.query.startDate) {
        query.eventDate.$gte = new Date(req.query.startDate); // Greater than or equal to start date
      }
      if (req.query.endDate) {
        // Add one day to endDate to include events on the end date
        const endDate = new Date(req.query.endDate);
        endDate.setDate(endDate.getDate() + 1); // Go to the next day
        query.eventDate.$lt = endDate; // Less than (up to, but not including) the next day
      }
    }
      // 4. Pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 events per page
    const skip = (page - 1) * limit; // Calculate documents to skip

  // Get total count of events matching the filters (before pagination)
    const totalEvents = await Event.countDocuments(query);

    // Fetch events with filters, sorting (optional, but good practice), and pagination
    const events = await Event.find(query)
                                .sort({ eventDate: 1, startTime: 1 }) // Sort by date and time (ascending)
                                .skip(skip)
                                .limit(limit)
                                .populate('organizer', 'name email'); // Populate organizer details

    res.status(200).json({
      events,
      page,
      pages: Math.ceil(totalEvents / limit), // Total number of pages
      totalEvents,
      limit,
    });

  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// 2. Get Single Event by ID
async function getEventById(req, res) {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// 3. Create New Event
async function createEvent(req, res) {
  const {
    eventName, description, eventDate, startTime, endTime,
    category, totalCapacity, location, relatedLinks, eventPrice
  } = req.body;

  if (!eventName || !description || !eventDate || !startTime || !endTime ||
      !category || !totalCapacity || !location || !eventPrice) {
    return res.status(400).json({ message: 'Please fill all required event fields.' });
  }

  try {
    const newEvent = new Event({
      eventName,
      description,
      eventDate,
      startTime,
      endTime,
      eventPrice,
      category,
      totalCapacity,
      location,
      relatedLinks,
      organizer: req.user._id, // <--- FIXED THIS LINE! Use _id from the Mongoose user document
    });

    const savedEvent = await newEvent.save();
    const populatedEvent = await Event.findById(savedEvent._id).populate('organizer', 'name email');

    res.status(201).json({
      message: 'Event created successfully!',
      event: populatedEvent
    });

  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// 4. Update Event by ID
async function updateEvent(req, res) {
  const { id } = req.params;
  const {
    eventName, description, eventDate, startTime, endTime,
    category, totalCapacity, location, relatedLinks, eventPrice
  } = req.body;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the authenticated user is the organizer of this event
    if (event.organizer.toString() !== req.user._id.toString()) { // <--- FIXED THIS LINE!
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this event' });
    }

    event.eventName = eventName || event.eventName;
    event.description = description || event.description;
    event.eventDate = eventDate || event.eventDate;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.category = category || event.category;
    event.eventPrice = eventPrice || event.eventPrice;

    if (totalCapacity !== undefined && totalCapacity < (event.totalCapacity - event.availableCapacity)) {
        return res.status(400).json({ message: 'New capacity cannot be less than current bookings.' });
    }
    if (totalCapacity !== undefined) {
        const capacityDifference = totalCapacity - event.totalCapacity;
        event.availableCapacity += capacityDifference;
        event.totalCapacity = totalCapacity;
    }
    event.location = location || event.location;
    event.relatedLinks = relatedLinks || event.relatedLinks;

    const updatedEvent = await event.save();
    const populatedEvent = await Event.findById(updatedEvent._id).populate('organizer', 'name email');

    res.status(200).json({
      message: 'Event updated successfully!',
      event: populatedEvent
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }
    console.error("Error updating event:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
// 5. Delete Event by ID
async function deleteEvent(req, res) {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the authenticated user is the organizer of this event
    if (event.organizer.toString() !== req.user._id.toString()) { // <--- FIXED THIS LINE!
      return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this event' });
    }

    await Event.deleteOne({ _id: id });

    res.status(200).json({ message: 'Event deleted successfully' });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }
    console.error("Error deleting event:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 6. Get authorized events 
// GET /api/events/my-events - Get events created by the authenticated organizer
async function getOrganizerEvents(req, res){
  try {
    const organizerId = req.user.id; // ID of the authenticated user (organizer)
    const currentDate = new Date();

    // Find events created by this organizer that are in the future
    const events = await Event.find({
      organizer: organizerId,
      eventDate: { $gte: currentDate } // Filter for upcoming events
    }).sort({ eventDate: 1 }); // Sort by date ascending

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    res.status(500).json({ message: 'Server error. Could not fetch events.' });
  }
};

// --- Event Routes ---

router.get(
    '/', 
    getAllEvents
);
router.get(
  '/my-events', 
  authMiddleware,
  authorizeRole(['organizer']), 
  getOrganizerEvents
);  
router.get(
    '/:id', 
    getEventById
);

router.post(
  '/',
  authMiddleware,
  authorizeRole(['organizer']),
  createEvent
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRole(['organizer']),
  updateEvent
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRole(['organizer']),
  deleteEvent
);

module.exports = router;