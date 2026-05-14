import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
import NotesView from './pages/NotesView';
import TasksView from './pages/TasksView';
import FocusView from './pages/FocusView';
import BinView from './pages/BinView';
import AuthView from './pages/AuthView';
import { ToastProvider } from './components/Toast';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  if (!token) {
    return (
      <ToastProvider>
        <AuthView setToken={setToken} setUserEmail={setUserEmail} />
      </ToastProvider>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUserEmail('');
  };

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <DashboardView token={token} userEmail={userEmail} setCurrentView={setCurrentView} />;
      case 'notes': return <NotesView token={token} />;
      case 'tasks': return <TasksView token={token} />;
      case 'focus': return <FocusView token={token} />;
      case 'bin': return <BinView token={token} />;
      default: return <DashboardView token={token} userEmail={userEmail} />;
    }
  };

  return (
    <ToastProvider>
      <div className="app-container">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          onLogout={handleLogout}
        />
        <main className="main-content">
          {renderView()}
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
