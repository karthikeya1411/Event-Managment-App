// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventPrice: {type: Number, required: true},
  startTime: { type: String, required: true }, // Mongoose expects 'startTime'
  endTime: { type: String, required: true },   // Mongoose expects 'endTime'
  category: { type: String, required: true },  // Mongoose expects 'category'
  totalCapacity: { // Mongoose expects 'totalCapacity'
    type: Number,
    required: true,
    min: 1,
  },
  availableCapacity: {
    type: Number,
    required: true,
    default: function() { return this.totalCapacity; },
    min: 0,
  },
  location: { type: String, required: true, trim: true }, // Mongoose expects 'location'
  relatedLinks: [ { name: String, url: String } ],
  organizer: { // Mongoose expects 'organizer' (ObjectId)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);