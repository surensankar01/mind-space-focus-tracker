import React, { useState, useEffect, useRef } from 'react';
import './NotesView.css';
import { useToast } from '../components/Toast';

export default function NotesView({ token }) {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();
  
  // Note Creation State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTags, setNewTags] = useState([]);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const fetchNotes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim()) return;
    const themes = [
      { color: 'var(--accent-pink)', height: '220px' },
      { color: 'var(--accent-sage)', height: '180px' },
      { color: 'var(--sidebar-bg)', height: '280px' },
      { color: 'var(--accent-peach)', height: '200px' },
      { color: 'var(--accent-lavender)', height: '160px' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    try {
      const res = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, content: newContent, color: theme.color, height: theme.height, tags: newTags })
      });
      const newNote = await res.json();
      setNotes([newNote, ...notes]);
      
      setNewTitle('');
      setNewContent('');
      setNewTags([]);
      setIsCreating(false);
      toast('Note saved successfully! 📝', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:5000/api/notes/${id}`, { 
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotes(notes.filter(n => n._id !== id));
      toast('Note moved to trash 🗑️', 'info');
    } catch (err) { console.error(err); }
  };

  // Inline Auto-saving Logic
  const handleEditChange = (id, field, value) => {
    const updatedNotes = notes.map(n => n._id === id ? { ...n, [field]: value } : n);
    setNotes(updatedNotes);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveNote(updatedNotes.find(n => n._id === id));
    }, 1000);
  };

  const saveNote = async (note) => {
    try {
      await fetch(`http://localhost:5000/api/notes/${note._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: note.title, content: note.content, tags: note.tags })
      });
      toast('Auto-saved ✅', 'info');
    } catch (err) { console.error(err); }
  };

  const handleCreateTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTag.trim() && !newTags.includes(newTag.trim())) {
        setNewTags([...newTags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewTags(newTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="notes-view animate-fade-in">
      <div className="notes-header">
        <h1>Your Notes</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      <div className="notes-grid">
        {isCreating && (
          <div className="note-card glass-panel create-note-form">
            <input 
              type="text" 
              placeholder="Give it a title..." 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="note-input-title"
              autoFocus
            />
            <textarea 
              placeholder="What's on your mind?"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="note-input-content"
            />
            
            <div className="tags-input-container">
              <div className="tags-list">
                {newTags.map(t => (
                  <span key={t} className="tag tag-interactive" onClick={() => removeTag(t)}>{t} ×</span>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="#Add tag (press Enter)" 
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleCreateTag}
                className="tag-input"
              />
            </div>

            <div className="note-form-actions">
              <button className="btn btn-primary" onClick={handleCreateNote}>Save</button>
            </div>
          </div>
        )}

        {notes.length === 0 && !isCreating && (
          <p style={{color: 'var(--text-light)', gridColumn: '1/-1'}}>Your workspace is empty! Create a beautiful note.</p>
        )}

        {notes.map(note => (
          <div 
            key={note._id} 
            className="note-card glass-panel"
            onClick={() => setEditingId(note._id)}
            style={{ borderTop: `6px solid ${note.color}`, height: note.height, position: 'relative', cursor: editingId === note._id ? 'default' : 'pointer' }}
          >
            <button className="delete-btn" onClick={(e) => deleteNote(note._id, e)} title="Move to Bin">×</button>
            
            {editingId === note._id ? (
              <>
                <input 
                  type="text" 
                  value={note.title}
                  onChange={(e) => handleEditChange(note._id, 'title', e.target.value)}
                  className="note-input-title"
                  style={{ width: '90%' }}
                />
                <textarea 
                  value={note.content}
                  onChange={(e) => handleEditChange(note._id, 'content', e.target.value)}
                  className="note-input-content edit-textarea"
                />
                <button className="btn" style={{marginTop: 'auto', alignSelf: 'flex-start', padding: '6px 12px'}} onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>Done Editing</button>
              </>
            ) : (
              <>
                <h3>{note.title}</h3>
                <p>{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="tags-list" style={{marginTop: 'auto', paddingTop: '12px'}}>
                    {note.tags.map(t => <span key={t} className="tag tag-display">{t}</span>)}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
