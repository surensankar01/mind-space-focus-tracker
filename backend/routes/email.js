const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// POST /api/email/send-reminder
// Body: { gmailUser, gmailAppPassword }
// Sends a deadline reminder email to the logged-in user's email
router.post('/send-reminder', auth, async (req, res) => {
  const { gmailUser, gmailAppPassword } = req.body;

  if (!gmailUser || !gmailAppPassword) {
    return res.status(400).json({ message: 'Gmail credentials are required.' });
  }

  try {
    // Fetch all incomplete tasks with a due date for this user
    const tasks = await Task.find({
      user: req.user.id,
      completed: false,
      dueDate: { $ne: null }
    }).sort({ dueDate: 1 });

    if (tasks.length === 0) {
      return res.status(200).json({ message: 'No pending tasks with deadlines. Nothing to email!' });
    }

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDayMs = 3 * oneDayMs;

    const overdue   = tasks.filter(t => new Date(t.dueDate) < now);
    const urgent    = tasks.filter(t => new Date(t.dueDate) >= now && (new Date(t.dueDate) - now) <= oneDayMs);
    const upcoming  = tasks.filter(t => new Date(t.dueDate) >= now && (new Date(t.dueDate) - now) > oneDayMs && (new Date(t.dueDate) - now) <= threeDayMs);
    const normal    = tasks.filter(t => (new Date(t.dueDate) - now) > threeDayMs);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const buildSection = (title, color, emoji, items) => {
      if (items.length === 0) return '';
      const rows = items.map(t => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2420;color:#FDFBF7;font-size:0.95rem;">${emoji} ${t.text}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #2a2420;color:${color};font-size:0.85rem;text-align:right;white-space:nowrap;">${formatDate(t.dueDate)}</td>
        </tr>`).join('');
      return `
        <div style="margin-bottom:28px;">
          <h3 style="color:${color};font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">${title}</h3>
          <table width="100%" style="border-collapse:collapse;background:#231F1C;border-radius:12px;overflow:hidden;">
            ${rows}
          </table>
        </div>`;
    };

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#1A1614;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
        
        <!-- Header -->
        <div style="background:#231F1C;border-radius:16px;padding:28px 32px;margin-bottom:24px;border:1px solid #38312C;">
          <h1 style="margin:0 0 6px;color:#FDFBF7;font-size:1.8rem;letter-spacing:-0.5px;">🧠 MindSpace</h1>
          <p style="margin:0;color:#ABA39D;font-size:0.9rem;">Your Deadline Reminder Report · ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</p>
        </div>

        <!-- Summary Banner -->
        <div style="background:#BC7A54;border-radius:12px;padding:16px 24px;margin-bottom:28px;display:flex;align-items:center;">
          <span style="font-size:1.5rem;margin-right:12px;">📋</span>
          <div>
            <p style="margin:0;color:#1A1614;font-weight:700;font-size:1rem;">${tasks.length} task${tasks.length > 1 ? 's' : ''} need${tasks.length === 1 ? 's' : ''} your attention</p>
            <p style="margin:4px 0 0;color:#1A1614;font-size:0.82rem;opacity:0.8;">
              ${overdue.length > 0 ? `${overdue.length} overdue &nbsp;·&nbsp; ` : ''}
              ${urgent.length > 0 ? `${urgent.length} urgent &nbsp;·&nbsp; ` : ''}
              ${upcoming.length > 0 ? `${upcoming.length} upcoming &nbsp;·&nbsp; ` : ''}
              ${normal.length > 0 ? `${normal.length} scheduled` : ''}
            </p>
          </div>
        </div>

        <!-- Task Sections -->
        ${buildSection('🚨 Overdue', '#A85A65', '🔴', overdue)}
        ${buildSection('⚡ Due Within 24 Hours', '#BC7A54', '🟠', urgent)}
        ${buildSection('⏳ Due Within 3 Days', '#c9a84c', '🟡', upcoming)}
        ${buildSection('📅 Upcoming', '#6B7B63', '🟢', normal)}

        <!-- Footer -->
        <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #38312C;">
          <p style="color:#ABA39D;font-size:0.8rem;margin:0;">Sent from MindSpace · Your personal productivity workspace</p>
          <p style="color:#38312C;font-size:0.75rem;margin:8px 0 0;">Stay focused. Stay consistent. 🔥</p>
        </div>
      </div>
    </body>
    </html>`;

    // Create transporter with user's Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword   // Gmail App Password (not regular password)
      }
    });

    await transporter.sendMail({
      from: `"MindSpace 🧠" <${gmailUser}>`,
      to: gmailUser,
      subject: `📋 MindSpace: ${overdue.length > 0 ? `${overdue.length} task(s) OVERDUE — ` : ''}Your Deadline Reminder`,
      html: htmlBody
    });

    res.json({ 
      message: `✅ Reminder email sent to ${gmailUser}!`,
      summary: { overdue: overdue.length, urgent: urgent.length, upcoming: upcoming.length, total: tasks.length }
    });

  } catch (err) {
    console.error('Email error:', err);
    if (err.code === 'EAUTH') {
      return res.status(401).json({ message: 'Gmail authentication failed. Check your App Password.' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
