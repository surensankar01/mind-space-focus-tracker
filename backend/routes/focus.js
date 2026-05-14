const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FocusSession = require('../models/FocusSession');

// Log a completed focus session
router.post('/', auth, async (req, res) => {
  const session = new FocusSession({ 
    user: req.user.id, 
    duration: req.body.duration 
  });
  
  try {
    await session.save();
    res.status(201).json(session);
  } catch (err) { 
    res.status(400).json({ message: err.message }); 
  }
});

// Get today's total focus time
router.get('/today', auth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  
  try {
    const sessions = await FocusSession.find({ 
      user: req.user.id, 
      completedAt: { $gte: startOfDay }
    });
    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.duration, 0);
    res.json({ totalMinutes, sessions });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = router;
