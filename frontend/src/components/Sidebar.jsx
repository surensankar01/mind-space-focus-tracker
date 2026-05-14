import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'focus', label: 'Focus', icon: '⏱️' },
    { id: 'bin', label: 'Trash Bin', icon: '🗑️' }
  ];

  return (
    <aside className="sidebar glass-panel animate-fade-in">
      <div className="sidebar-header">
        <h2>MindSpace</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(item => (
            <li key={item.id}>
              <button 
                className={`nav-button ${currentView === item.id ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-icon" onClick={onLogout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
