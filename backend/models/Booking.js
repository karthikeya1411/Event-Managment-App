// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference to the User who made the booking
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the 'User' model
    required: true,
  },
  // Reference to the Event being booked
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event', // Links to the 'Event' model
    required: true,
  },
  // Number of tickets booked in this specific booking
  numberOfTickets: {
    type: Number,
    required: true,
    min: 1, // A booking must be for at least 1 ticket
  },
  // Status of the booking (e.g., pending_confirmation, confirmed, cancelled)
  status: {
    type: String,
    enum: ['pending_confirmation', 'confirmed', 'cancelled'], // Restricts status to these values
    default: 'confirmed', // Default to 'confirmed' for simplicity (can be 'pending' for payment flows)
    required: true,
  },
  // Total price for this booking, calculated based on eventPrice * numberOfTickets
  totalPrice: {
    type: Number,
    required: true, // This should be required now as we calculate it
    min: 0, // Price cannot be negative
  },
  // NEW FIELD: Array to store details for each individual ticket
  tickets: [
    {
      uniqueTicketId: {
        type: String,
        required: true,
        unique: true, // Ensures each ticket ID is unique across all bookings
      },
      qrCodeDataUrl: {
        type: String, // Stores the Base64 encoded QR code image data
        required: true,
      },
      status: {
        type: String,
        enum: ['active', 'scanned', 'cancelled'], // Status of the individual ticket
        default: 'active',
        required: true,
      },
    },
  ],
}, { timestamps: true }); // Mongoose adds `createdAt` and `updatedAt` fields automatically

module.exports = mongoose.model('Booking', bookingSchema);