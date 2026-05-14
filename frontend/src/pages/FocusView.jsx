import React, { useState, useEffect } from 'react';
import './FocusView.css';
import { useToast } from '../components/Toast';

export default function FocusView({ token }) {
  // User-configurable durations (in minutes)
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isEditing, setIsEditing] = useState(false);

  // Temp values while editing (so live timer doesn't change mid-session)
  const [tempFocus, setTempFocus] = useState(25);
  const [tempBreak, setTempBreak] = useState(5);

  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus');
  const toast = useToast();

  const totalTime = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Tick the timer
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);

      if (mode === 'focus') {
        fetch('http://localhost:5000/api/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ duration: focusDuration })
        }).catch(err => console.error(err));
        toast(`⏰ Focus session complete! ${focusDuration} mins logged. Take a break!`, 'special');
      } else {
        toast('☕ Break over! Ready to focus again?', 'info');
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const openSettings = () => {
    if (isRunning) {
      toast('Pause the timer before changing settings!', 'error');
      return;
    }
    setTempFocus(focusDuration);
    setTempBreak(breakDuration);
    setIsEditing(true);
  };

  const applySettings = () => {
    const f = Math.max(1, Math.min(99, Number(tempFocus)));
    const b = Math.max(1, Math.min(60, Number(tempBreak)));
    setFocusDuration(f);
    setBreakDuration(b);
    setIsEditing(false);
    // Reset timer to new duration
    const newTime = mode === 'focus' ? f * 60 : b * 60;
    setTimeLeft(newTime);
    setIsRunning(false);
    toast(`✅ Timer updated! Focus: ${f} min | Break: ${b} min`, 'success');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Ring color changes based on mode
  const ringColor = mode === 'focus' ? 'var(--accent-pink)' : 'var(--accent-sage)';

  return (
    <div className="focus-view animate-fade-in">
      <div className="focus-header">
        <h1>Focus Tracker</h1>
        <button className="settings-btn" onClick={openSettings} title="Customize timer">
          ⚙️ Customize
        </button>
      </div>

      {/* Settings Panel */}
      {isEditing && (
        <div className="settings-panel glass-panel animate-fade-in">
          <h3>⚙️ Customize Your Timer</h3>
          <div className="settings-row">
            <div className="setting-group">
              <label>🍅 Focus Duration</label>
              <div className="duration-input-wrap">
                <button className="dur-btn" onClick={() => setTempFocus(Math.max(1, tempFocus - 5))}>−5</button>
                <input
                  type="number"
                  value={tempFocus}
                  min="1" max="99"
                  onChange={(e) => setTempFocus(e.target.value)}
                  className="duration-input"
                />
                <span className="dur-unit">min</span>
                <button className="dur-btn" onClick={() => setTempFocus(Math.min(99, tempFocus + 5))}>+5</button>
              </div>
            </div>
            <div className="setting-group">
              <label>☕ Break Duration</label>
              <div className="duration-input-wrap">
                <button className="dur-btn" onClick={() => setTempBreak(Math.max(1, tempBreak - 1))}>−1</button>
                <input
                  type="number"
                  value={tempBreak}
                  min="1" max="60"
                  onChange={(e) => setTempBreak(e.target.value)}
                  className="duration-input"
                />
                <span className="dur-unit">min</span>
                <button className="dur-btn" onClick={() => setTempBreak(Math.min(60, tempBreak + 1))}>+1</button>
              </div>
            </div>
          </div>
          <div className="settings-actions">
            <button className="btn btn-primary" onClick={applySettings}>Apply</button>
            <button className="btn" style={{background: 'var(--border-color)'}} onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="focus-container">
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'focus' ? 'active' : ''}`}
            onClick={() => switchMode('focus')}
          >
            🍅 Pomodoro ({focusDuration}m)
          </button>
          <button
            className={`mode-btn ${mode === 'break' ? 'active' : ''}`}
            onClick={() => switchMode('break')}
          >
            ☕ Short Break ({breakDuration}m)
          </button>
        </div>

        <div className="timer-wrapper glass-panel">
          <div className="progress-ring">
            <svg viewBox="0 0 100 100">
              <circle className="ring-bg" cx="50" cy="50" r="45"></circle>
              <circle
                className="ring-progress"
                cx="50" cy="50" r="45"
                style={{
                  strokeDashoffset: `calc(283 - (283 * ${progress}) / 100)`,
                  stroke: ringColor
                }}
              ></circle>
            </svg>
            <div className="time-display">
              <h2>{formatTime(timeLeft)}</h2>
              <p>{mode === 'focus' ? 'Stay focused' : 'Relax 😌'}</p>
            </div>
          </div>

          <div className="timer-controls">
            <button className="btn btn-primary btn-large" onClick={toggleTimer}>
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className="btn btn-secondary btn-icon" onClick={resetTimer} title="Reset">
              🔄
            </button>
          </div>
        </div>

        {/* Session info strip */}
        <div className="session-info">
          <span>Focus: <strong>{focusDuration} min</strong></span>
          <span className="info-divider">·</span>
          <span>Break: <strong>{breakDuration} min</strong></span>
          <span className="info-divider">·</span>
          <span>{isRunning ? '🟢 Running' : '⏸ Paused'}</span>
        </div>
      </div>
    </div>
  );
}
