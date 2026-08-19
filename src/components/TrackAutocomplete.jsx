import { useEffect, useRef, useState } from 'react';
import './TrackAutocomplete.css';

/**
 * Coppia di input (titolo + artista) con dropdown suggerimenti Spotify.
 * L'utente può scrivere liberamente OPPURE selezionare un risultato.
 *
 * Props:
 *   - titleValue, artistValue
 *   - onChangeTitle(str), onChangeArtist(str), onSelectPair({title, artist})
 *   - label: string ('A' o 'B')
 *   - disabled
 */
export default function TrackAutocomplete({
  titleValue, artistValue,
  onChangeTitle, onChangeArtist, onSelectPair,
  disabled,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const lastQueryRef = useRef('');

  // Chiudi al click fuori
  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function scheduleSearch(query) {
    clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (q === lastQueryRef.current) return;
      lastQueryRef.current = q;
      setLoading(true);
      try {
        const r = await fetch(`/api/spotify-search?q=${encodeURIComponent(q)}`);
        const data = await r.json();
        setResults(data.results || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleTitleChange(e) {
    const v = e.target.value;
    onChangeTitle(v);
    scheduleSearch(v + ' ' + (artistValue || ''));
  }
  function handleArtistChange(e) {
    const v = e.target.value;
    onChangeArtist(v);
    // Ricerca solo se titolo c'è, e usa titolo+artista come query
    if ((titleValue || '').trim().length >= 2) scheduleSearch((titleValue || '') + ' ' + v);
  }

  function selectResult(r) {
    onSelectPair({ title: r.title, artist: r.artist });
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectResult(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="ta-wrap" ref={wrapRef}>
      <div className="ta-fields">
        <label className="ta-field">
          <span>Titolo *</span>
          <input
            type="text"
            value={titleValue}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            required
            disabled={disabled}
            autoComplete="off"
          />
        </label>
        <label className="ta-field">
          <span>Artista *</span>
          <input
            type="text"
            value={artistValue}
            onChange={handleArtistChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            required
            disabled={disabled}
            autoComplete="off"
          />
        </label>
      </div>

      {open && (loading || results.length > 0) && (
        <div className="ta-dropdown">
          {loading && <div className="ta-loading mono">Ricerca su Spotify...</div>}
          {!loading && results.map((r, i) => (
            <button
              type="button"
              key={r.id}
              className={`ta-item ${i === activeIdx ? 'ta-item-active' : ''}`}
              onClick={() => selectResult(r)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {r.cover
                ? <img src={r.cover} alt="" className="ta-cover" />
                : <div className="ta-cover-fallback">♪</div>}
              <div className="ta-info">
                <div className="ta-title">{r.title}</div>
                <div className="ta-artist">{r.artist}</div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="ta-empty mono">Nessun risultato</div>
          )}
        </div>
      )}
    </div>
  );
}
