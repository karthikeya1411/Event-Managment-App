const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/event', require('./routes/events'));
app.use('/api/booking', require('./routes/bookings'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Event Management API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});