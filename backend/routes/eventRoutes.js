const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/authMiddleware');
const Registration = require('../models/Registration');

// Get KPI Stats for Organizer
router.get('/stats', protect, authorize('Organizer'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    const eventIds = events.map(e => e._id);
    
    const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });
    const totalCheckedIn = await Registration.countDocuments({ event: { $in: eventIds }, status: 'Checked-In' });
    
    res.json({
      totalEvents: events.length,
      totalRegistrations,
      totalCheckedIn
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});
// Get all events (Needed for your dashboards)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new event (Now accepting imageUrl)
router.post('/', protect, authorize('Organizer'), async (req, res) => {
  try {
    const { name, date, venue, capacity, imageUrl } = req.body; 

    const event = await Event.create({
      name,
      date,
      venue,
      capacity,
      imageUrl,
      organizer: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Event Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;