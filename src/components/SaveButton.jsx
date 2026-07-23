import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './SaveButton.css';

/**
 * Bottone salva: apre popover con lista delle proprie collections.
 * L'utente può spuntare/togliere la transizione da ciascuna, o crearne una nuova.
 */
export default function SaveButton({ transitionId, size = 'md' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [savedIn, setSavedIn] = useState([]); // ID delle collezioni che già contengono questa transizione
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const popoverRef = useRef(null);

  // Chiudi popover al click fuori
  useEffect(() => {
    function onClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Carica dati quando apri il popover
  useEffect(() => {
    if (!open || !user || !supabase) return;
    fetchData();
  }, [open, user]);

  async function fetchData() {
    setLoading(true);
    const [{ data: cols }, { data: rels }] = await Promise.all([
      supabase.from('collections').select('id, name, is_default').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at'),
      supabase.from('collection_transitions').select('collection_id').eq('transition_id', transitionId),
    ]);
    setCollections(cols || []);
    setSavedIn((rels || []).map((r) => r.collection_id));
    setLoading(false);
  }

  async function toggleCollection(collectionId) {
    const isSaved = savedIn.includes(collectionId);
    // Ottimistico
    setSavedIn((s) => isSaved ? s.filter((x) => x !== collectionId) : [...s, collectionId]);

    if (isSaved) {
      const { error } = await supabase.from('collection_transitions').delete()
        .eq('collection_id', collectionId).eq('transition_id', transitionId);
      if (error) setSavedIn((s) => [...s, collectionId]); // rollback
    } else {
      const { error } = await supabase.from('collection_transitions').insert({
        collection_id: collectionId, transition_id: transitionId,
      });
      if (error) setSavedIn((s) => s.filter((x) => x !== collectionId)); // rollback
    }
  }

  async function createCollection(e) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const { data, error } = await supabase.from('collections').insert({
      user_id: user.id, name: newName.trim(),
    }).select().single();

    if (!error && data) {
      setCollections((c) => [...c, data]);
      setNewName('');
      // Auto-salva in questa nuova collezione
      await supabase.from('collection_transitions').insert({
        collection_id: data.id, transition_id: transitionId,
      });
      setSavedIn((s) => [...s, data.id]);
    }
    setCreating(false);
  }

  function handleTrigger(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setOpen((v) => !v);
  }

  const isSavedAnywhere = savedIn.length > 0;

  return (
    <div className="save-wrap" ref={popoverRef}>
      <button
        className={`save-btn save-btn-${size} ${isSavedAnywhere ? 'save-btn-active' : ''}`}
        onClick={handleTrigger}
        aria-label="Salva transizione"
      >
        <svg viewBox="0 0 24 24" fill={isSavedAnywhere ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {open && (
        <div className="save-pop" onClick={(e) => e.preventDefault()}>
          <div className="save-pop-head">Salva in...</div>

          {loading ? (
            <div className="save-pop-empty">Caricamento...</div>
          ) : (
            <ul className="save-pop-list">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    className="save-pop-item"
                    onClick={(e) => { e.preventDefault(); toggleCollection(c.id); }}
                  >
                    <span className={`save-check ${savedIn.includes(c.id) ? 'save-check-on' : ''}`}>
                      {savedIn.includes(c.id) && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                    </span>
                    <span className="save-name">{c.name}</span>
                    {c.is_default && <span className="save-default mono">default</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={createCollection} className="save-pop-new">
            <input
              type="text"
              placeholder="Nuova collezione..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              disabled={creating}
              onClick={(e) => e.stopPropagation()}
            />
            <button type="submit" disabled={!newName.trim() || creating} className="save-pop-create">
              +
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
