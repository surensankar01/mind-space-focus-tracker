const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: Number, required: true }, // in minutes
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FocusSession', focusSessionSchema);
