import React, { useState, useEffect } from 'react';
import './NotesView.css';
import { useToast } from '../components/Toast';

export default function BinView({ token }) {
  const [notes, setNotes] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchBin();
  }, [token]);

  const fetchBin = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notes/bin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(Array.isArray(data)) setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notes/${id}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotes(notes.filter(n => n._id !== id));
      toast('Note restored to your workspace! 🎉', 'success');

    } catch (err) { console.error(err); }
  };

  return (
    <div className="notes-view animate-fade-in">
      <div className="notes-header">
        <h1>Trash Bin</h1>
      </div>
      <p style={{color: 'var(--text-light)', marginBottom: '32px'}}>Notes are permanently deleted after 15 days.</p>

      <div className="notes-grid">
        {notes.length === 0 && (
          <p style={{color: 'var(--text-light)', gridColumn: '1/-1'}}>Your bin is empty.</p>
        )}

        {notes.map(note => (
          <div 
            key={note._id} 
            className="note-card glass-panel"
            style={{ borderTop: `6px solid ${note.color}`, height: note.height, opacity: 0.6 }}
          >
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <button className="btn btn-primary" style={{marginTop: 'auto', alignSelf: 'flex-start'}} onClick={() => handleRestore(note._id)}>
              Restore Note
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
