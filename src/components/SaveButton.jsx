import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './SaveButton.css';

export default function SaveButton({ transitionId, size = 'md' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [savedIn, setSavedIn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    fetchData();
  }, [user, transitionId]);

  async function fetchData() {
    setLoading(true);
    const [{ data: cols }, { data: rels }] = await Promise.all([
      supabase.from('collections').select('id, name, is_default').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at'),
      supabase.from('collection_transitions').select('collection_id').eq('transition_id', transitionId),
    ]);
    setCollections(cols || []);
    // Filtra solo le collezioni che appartengono a questo utente
    const myCollectionIds = (cols || []).map((c) => c.id);
    const mySaved = (rels || []).filter((r) => myCollectionIds.includes(r.collection_id)).map((r) => r.collection_id);
    setSavedIn(mySaved);
    setLoading(false);
  }

  async function toggleCollection(collectionId) {
    setError(null);
    const isSaved = savedIn.includes(collectionId);
    setSavedIn((s) => isSaved ? s.filter((x) => x !== collectionId) : [...s, collectionId]);

    if (isSaved) {
      const { error } = await supabase.from('collection_transitions').delete()
        .eq('collection_id', collectionId).eq('transition_id', transitionId);
      if (error) { setSavedIn((s) => [...s, collectionId]); setError('Errore rimozione.'); }
    } else {
      const { error } = await supabase.from('collection_transitions').insert({
        collection_id: collectionId, transition_id: transitionId,
      });
      if (error) { setSavedIn((s) => s.filter((x) => x !== collectionId)); setError('Errore salvataggio.'); }
    }
  }

  async function createCollection(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);

    const { data: newCol, error: colError } = await supabase.from('collections').insert({
      user_id: user.id, name: newName.trim(),
    }).select().single();

    if (colError || !newCol) {
      setError('Errore nella creazione della collezione.');
      setCreating(false);
      return;
    }

    // Aggiungo subito la nuova collezione alla lista visibile
    setCollections((c) => [...c, newCol]);

    // Salva la transizione nella nuova collezione
    const { error: insertError } = await supabase.from('collection_transitions').insert({
      collection_id: newCol.id, transition_id: transitionId,
    });

    if (insertError) {
      setError('Collezione creata ma salvataggio fallito.');
    } else {
      setSavedIn((s) => [...s, newCol.id]);
      setNewName('');
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
        <div className="save-pop" onClick={(e) => e.stopPropagation()}>
          <div className="save-pop-head">Salva in...</div>

          {loading ? (
            <div className="save-pop-empty">Caricamento...</div>
          ) : (
            <ul className="save-pop-list">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="save-pop-item"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCollection(c.id); }}
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
            <button
              type="submit"
              disabled={!newName.trim() || creating}
              className="save-pop-create"
              onClick={(e) => e.stopPropagation()}
            >
              +
            </button>
          </form>

          {error && <div className="save-pop-error">{error}</div>}
        </div>
      )}
    </div>
  );
}
