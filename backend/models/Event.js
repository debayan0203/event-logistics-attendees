const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  capacity: { type: Number, required: true },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);