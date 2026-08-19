const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// 1. Capacity Control added to Registration
router.post('/:eventId', protect, authorize('Attendee'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user already registered
    const existing = await Registration.findOne({ event: req.params.eventId, attendee: req.user._id });
    if (existing) return res.status(400).json({ message: 'You are already registered for this event.' });

    // Check Capacity
    const currentCount = await Registration.countDocuments({ event: req.params.eventId });
    if (currentCount >= event.capacity) {
      return res.status(400).json({ message: 'Sorry, this event is completely sold out.' });
    }

    const qrId = crypto.randomBytes(16).toString('hex');
    const registration = await Registration.create({
      event: req.params.eventId,
      attendee: req.user._id,
      qrId
    });

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/my-tickets', protect, authorize('Attendee'), async (req, res) => {
  try {
    const tickets = await Registration.find({ attendee: req.user._id }).populate('event');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// 2. Targeted Room Update on Scan
router.put('/scan/:qrId', protect, authorize('Volunteer', 'Organizer'), async (req, res) => {
  try {
    const registration = await Registration.findOne({ qrId: req.params.qrId })
      .populate('attendee', 'name email')
      .populate('event', 'name');

    if (!registration) return res.status(404).json({ message: 'Invalid QR Code. Ticket not found.' });
    if (registration.status === 'Checked-In') return res.status(400).json({ message: 'Ticket has already been used.' });

    registration.status = 'Checked-In';
    registration.checkInTime = Date.now();
    await registration.save();

    // Trigger the WebSocket event specifically to the event room
    const io = req.app.get('io');
    if (io) {
      // We convert the MongoDB ObjectId to a standard string
      const roomId = registration.event._id.toString();
      
      // We use .to(roomId) to target only the specific room!
      io.to(roomId).emit('newCheckIn', { eventId: roomId, attendeeName: registration.attendee.name });
    }

    res.json({ message: 'Check-in successful', attendee: registration.attendee.name, event: registration.event.name });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;