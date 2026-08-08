const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  qrId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending', 'Checked-In'], default: 'Pending' },
  checkInTime: { type: Date },
  gate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);