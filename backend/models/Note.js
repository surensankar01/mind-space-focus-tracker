const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  color: { type: String, default: 'var(--sidebar-bg)' },
  height: { type: String, default: '200px' },
  tags: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

// MongoDB Time-To-Live (TTL) magic!
// If `deletedAt` has a valid Date, MongoDB will securely hard-delete it exactly 15 days later (1296000 seconds).
noteSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 });

module.exports = mongoose.model('Note', noteSchema);
