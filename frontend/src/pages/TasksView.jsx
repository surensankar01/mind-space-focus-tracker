import React, { useState, useEffect } from 'react';
import './TasksView.css';
import { useToast } from '../components/Toast';

// ── Deadline helpers ──────────────────────────────────────────────────────────
function getDeadlineStatus(dueDate) {
  if (!dueDate) return null;
  const now  = new Date();
  const due  = new Date(dueDate);
  const diff = due - now;                        // ms
  const h24  =  1 * 24 * 60 * 60 * 1000;
  const h72  =  3 * 24 * 60 * 60 * 1000;

  if (diff < 0)    return { label: 'Overdue',       cls: 'deadline-overdue',  icon: '🔴' };
  if (diff < h24)  return { label: 'Due in <24h',   cls: 'deadline-urgent',   icon: '🟠' };
  if (diff < h72)  return { label: 'Due in 3 days', cls: 'deadline-upcoming', icon: '🟡' };
  return             { label: 'Scheduled',           cls: 'deadline-normal',   icon: '🟢' };
}

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  return new Date(dueDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── Email Modal ───────────────────────────────────────────────────────────────
function EmailModal({ token, onClose }) {
  const [gmailUser, setGmailUser]         = useState(localStorage.getItem('ms_gmail') || '');
  const [gmailAppPassword, setAppPassword]= useState(localStorage.getItem('ms_gpass') || '');
  const [loading, setLoading]             = useState(false);
  const [result,  setResult]              = useState(null);
  const toast = useToast();

  const handleSend = async () => {
    if (!gmailUser || !gmailAppPassword) {
      toast('Please fill in both fields!', 'error'); return;
    }
    setLoading(true); setResult(null);
    // Save credentials locally for convenience
    localStorage.setItem('ms_gmail', gmailUser);
    localStorage.setItem('ms_gpass', gmailAppPassword);
    try {
      const res  = await fetch('http://localhost:5000/api/email/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gmailUser, gmailAppPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult({ ok: true, msg: data.message, summary: data.summary });
      toast('📧 Reminder email sent!', 'special');
    } catch (err) {
      setResult({ ok: false, msg: err.message });
      toast('Email failed: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📧 Send Deadline Reminder</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="modal-subtitle">
          Enter your Gmail credentials. We'll email YOU a full breakdown of your deadlines.
        </p>

        <div className="modal-info-box">
          <p>💡 <strong>Need an App Password?</strong><br/>
          Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail"</p>
        </div>

        <div className="modal-field">
          <label>Gmail Address</label>
          <input
            type="email"
            placeholder="you@gmail.com"
            value={gmailUser}
            onChange={e => setGmailUser(e.target.value)}
            className="modal-input"
          />
        </div>
        <div className="modal-field">
          <label>Gmail App Password <span>(not your regular password)</span></label>
          <input
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={gmailAppPassword}
            onChange={e => setAppPassword(e.target.value)}
            className="modal-input"
          />
        </div>

        {result && (
          <div className={`modal-result ${result.ok ? 'result-ok' : 'result-err'}`}>
            {result.msg}
            {result.ok && result.summary && (
              <p style={{ marginTop: 6, fontSize: '0.8rem', opacity: 0.8 }}>
                {result.summary.overdue > 0 && `🔴 ${result.summary.overdue} overdue  `}
                {result.summary.urgent  > 0 && `🟠 ${result.summary.urgent} urgent  `}
                {result.summary.total} tasks total
              </p>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? '⏳ Sending...' : '📤 Send Email'}
          </button>
          <button className="btn" style={{ background: 'var(--border-color)' }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main TasksView ────────────────────────────────────────────────────────────
export default function TasksView({ token }) {
  const [tasks,       setTasks]       = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate,  setNewDueDate]  = useState('');
  const [showEmail,   setShowEmail]   = useState(false);
  const toast = useToast();

  useEffect(() => { fetchTasks(); }, [token]);

  const fetchTasks = async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) { console.error(err); }
  };

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map(t => t._id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    const task = updatedTasks.find(t => t._id === id);
    if (task.completed) {
      toast('Task completed! Great work! 💪', 'success');
      const allDone = updatedTasks.every(t => t.completed);
      if (allDone && updatedTasks.length > 0)
        setTimeout(() => toast('🎉 All tasks done! You crushed it today!', 'special'), 600);
    } else {
      toast('Task marked as pending', 'info');
    }
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT', headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (err) { fetchTasks(); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }
      });
      setTasks(tasks.filter(t => t._id !== id));
      toast('Task deleted', 'info');
    } catch (err) { console.error(err); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ text: newTaskText, dueDate: newDueDate || null })
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setNewTaskText(''); setNewDueDate('');
      toast(newDueDate ? '📅 Task added with deadline!' : 'New task added!', 'success');
    } catch (err) { console.error(err); }
  };

  const handleSetDeadline = async (id, dueDate) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}/deadline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ dueDate: dueDate || null })
      });
      const updated = await res.json();
      setTasks(tasks.map(t => t._id === id ? updated : t));
      toast(dueDate ? '📅 Deadline set!' : 'Deadline removed', 'info');
    } catch (err) { console.error(err); }
  };

  const pending   = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t =>  t.completed);
  const overdueCount = pending.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
  const urgentCount  = pending.filter(t => {
    if (!t.dueDate) return false;
    const diff = new Date(t.dueDate) - new Date();
    return diff >= 0 && diff < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="tasks-view animate-fade-in">

      {/* Header */}
      <div className="tasks-header">
        <div>
          <h1>Your Tasks</h1>
          <p className="tasks-subtitle">{pending.length} pending · {completed.length} completed</p>
        </div>
        <button className="btn email-btn" onClick={() => setShowEmail(true)}>
          📧 Email Reminders
        </button>
      </div>

      {/* Deadline Warning Banner */}
      {(overdueCount > 0 || urgentCount > 0) && (
        <div className="deadline-warning-banner animate-fade-in">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            {overdueCount > 0 && <span className="overdue-pill">🔴 {overdueCount} Overdue</span>}
            {urgentCount  > 0 && <span className="urgent-pill">🟠 {urgentCount} Due &lt;24h</span>}
            <span>Don't forget your deadlines!</span>
          </div>
          <button className="btn email-btn-sm" onClick={() => setShowEmail(true)}>
            Send Email
          </button>
        </div>
      )}

      {/* Create Task Form */}
      <div className="task-list glass-panel">
        <form onSubmit={handleCreateTask} className="task-item new-task-form">
          <button type="submit" className="add-task-btn">+</button>
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            className="task-input"
          />
          <input
            type="datetime-local"
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            className="due-date-input"
            title="Set deadline (optional)"
          />
        </form>

        {tasks.length === 0 && (
          <p style={{ color: 'var(--text-light)', padding: '16px' }}>No tasks yet. Add one above!</p>
        )}

        {/* Pending tasks */}
        {pending.map(task => {
          const status = getDeadlineStatus(task.dueDate);
          return (
            <div key={task._id} className={`task-item animate-fade-in ${status ? status.cls : ''}`}>
              <label className="checkbox-container">
                <input type="checkbox" checked={false} onChange={() => toggleTask(task._id)} />
                <span className="checkmark"></span>
              </label>
              <div className="task-body">
                <span className="task-text">{task.text}</span>
                {task.dueDate && status && (
                  <span className={`deadline-badge ${status.cls}`}>
                    {status.icon} {status.label} · {formatDueDate(task.dueDate)}
                  </span>
                )}
              </div>
              <div className="task-actions">
                <input
                  type="datetime-local"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0,16) : ''}
                  onChange={e => handleSetDeadline(task._id, e.target.value)}
                  className="inline-date-input"
                  title="Set/change deadline"
                />
                <button className="task-delete-btn" onClick={() => handleDelete(task._id)}>×</button>
              </div>
            </div>
          );
        })}

        {/* Divider */}
        {pending.length > 0 && completed.length > 0 && (
          <div className="completed-divider"><span>Completed ({completed.length})</span></div>
        )}

        {/* Completed tasks */}
        {completed.map(task => (
          <div key={task._id} className="task-item completed animate-fade-in">
            <label className="checkbox-container">
              <input type="checkbox" checked={true} onChange={() => toggleTask(task._id)} />
              <span className="checkmark"></span>
            </label>
            <div className="task-body">
              <span className="task-text">{task.text}</span>
            </div>
            <button className="task-delete-btn" onClick={() => handleDelete(task._id)}>×</button>
          </div>
        ))}
      </div>

      {/* Email Modal */}
      {showEmail && <EmailModal token={token} onClose={() => setShowEmail(false)} />}
    </div>
  );
}
