import React, { useState, useEffect, useCallback } from 'react';
import './DashboardView.css';

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Small steps every day lead to big results.", author: "Anonymous" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardView({ token, userEmail, setCurrentView }) {
  const [stats, setStats] = useState(null);
  const [deadlineWarning, setDeadlineWarning] = useState({ overdue: 0, urgent: 0 });
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const firstName = userEmail ? userEmail.split('@')[0] : 'there';

  useEffect(() => {
    fetchStats();
    fetchDeadlineWarnings();
  }, [token]);

  const fetchDeadlineWarnings = async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasks = await res.json();
      if (!Array.isArray(tasks)) return;
      const now   = new Date();
      const h24   = 24 * 60 * 60 * 1000;
      const pending = tasks.filter(t => !t.completed && t.dueDate);
      const overdue = pending.filter(t => new Date(t.dueDate) < now).length;
      const urgent  = pending.filter(t => {
        const diff = new Date(t.dueDate) - now;
        return diff >= 0 && diff < h24;
      }).length;
      setDeadlineWarning({ overdue, urgent });
    } catch(e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  if (!stats) return (
    <div className="dashboard-loading">
      <div className="loading-spinner"></div>
      <p>Loading your space...</p>
    </div>
  );

  const totalTasks = stats.tasks.pending + stats.tasks.completed;
  const completionPct = totalTasks > 0 ? Math.round((stats.tasks.completed / totalTasks) * 100) : 0;

  return (
    <div className="dashboard-view animate-fade-in">

      {/* Deadline Alert Banner */}
      {(deadlineWarning.overdue > 0 || deadlineWarning.urgent > 0) && (
        <div className="dash-deadline-alert animate-fade-in">
          <span style={{fontSize:'1.4rem'}}>⚠️</span>
          <div style={{flex:1}}>
            <p className="alert-title">Deadline Alert!</p>
            <p className="alert-body">
              {deadlineWarning.overdue > 0 && <span className="alert-pill overdue-pill">🔴 {deadlineWarning.overdue} Overdue</span>}
              {deadlineWarning.urgent  > 0 && <span className="alert-pill urgent-pill">🟠 {deadlineWarning.urgent} Due &lt;24h</span>}
              Review your tasks before it's too late!
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{padding:'8px 16px', fontSize:'0.85rem', whiteSpace:'nowrap'}}
            onClick={() => setCurrentView && setCurrentView('tasks')}
          >
            View Tasks →
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div className="welcome-text">
          <p className="greeting-tag">👋 {getGreeting()},</p>
          <h1 className="welcome-name">{firstName}</h1>
          <p className="welcome-subtitle">Here's your productivity snapshot for today.</p>
        </div>
        <div className="quote-box">
          <p className="quote-text">"{quote.text}"</p>
          <p className="quote-author">— {quote.author}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">

        <div className="stat-card glass-panel" style={{ borderTop: '4px solid var(--accent-peach)'}}>
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>Current Streak</h3>
            <p className="stat-number">{stats.streaks.current} <span>days</span></p>
            <span className="stat-label">Best: {stats.streaks.longest} days</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderTop: '4px solid var(--accent-sage)'}}>
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Tasks Done</h3>
            <p className="stat-number">{stats.tasks.completed} <span>/ {totalTasks}</span></p>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${completionPct}%`, background: 'var(--accent-sage)' }}></div>
            </div>
            <span className="stat-label">{completionPct}% complete</span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderTop: '4px solid var(--accent-lavender)'}}>
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>Focus Time</h3>
            <p className="stat-number">{stats.focusMinutes} <span>mins</span></p>
            <span className="stat-label">
              {stats.focusMinutes >= 25 ? `${Math.floor(stats.focusMinutes / 25)} session(s) today` : 'Start a session!'}
            </span>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderTop: '4px solid var(--accent-pink)'}}>
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>Pending Tasks</h3>
            <p className="stat-number">{stats.tasks.pending} <span>left</span></p>
            <span className="stat-label">{stats.tasks.pending === 0 ? '🎉 All clear!' : 'Keep going!'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
