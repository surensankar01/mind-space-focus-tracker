const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// Get all non-deleted notes for user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id, isDeleted: false }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all deleted notes (The Bin)
router.get('/bin', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one note
router.post('/', auth, async (req, res) => {
  const note = new Note({
    user: req.user.id,
    title: req.body.title,
    content: req.body.content,
    color: req.body.color,
    height: req.body.height,
    tags: req.body.tags || []
  });

  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a note (Auto-save Edit)
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        title: req.body.title, 
        content: req.body.content, 
        tags: req.body.tags 
      },
      { new: true } // return updated doc
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Soft Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    // We update isDeleted and set the TTL trigger deletedAt instead of completely deleting!
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found or unauthorized' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restore a note from the bin
router.put('/:id/restore', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { isDeleted: false }, $unset: { deletedAt: "" } },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
