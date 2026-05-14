const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');

// Calculate and fetch dashboard stats
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Calculate Streaks
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0,0,0,0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastActive) {
      user.currentStreak = 1;
      user.longestStreak = 1;
    } else if (lastActive.getTime() === yesterday.getTime()) {
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) user.longestStreak = user.currentStreak;
    } else if (lastActive.getTime() < yesterday.getTime()) {
      user.currentStreak = 1; // Streak broken
    }
    
    // Always update lastActiveDate to right now
    user.lastActiveDate = new Date();
    await user.save();

    // 2. Fetch Tasks stats
    const tasks = await Task.find({ user: req.user.id });
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const completedTasks = tasks.filter(t => t.completed).length;

    // 3. Fetch Focus Minutes Today
    const sessions = await FocusSession.find({ user: req.user.id, completedAt: { $gte: today }});
    const focusMinutes = sessions.reduce((acc, curr) => acc + curr.duration, 0);

    res.json({
      streaks: { current: user.currentStreak, longest: user.longestStreak },
      tasks: { pending: pendingTasks, completed: completedTasks },
      focusMinutes
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
