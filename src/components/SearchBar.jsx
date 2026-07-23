import { useState } from 'react';
import { CAMELOT_KEYS, BPM_STEPS } from '../lib/camelot';
import './SearchBar.css';

/**
 * Barra di ricerca / filtri.
 * Propaga i filtri al parent via onFilterChange({ text, key, bpmMin, bpmMax }).
 */
export default function SearchBar({ onFilterChange }) {
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');

  function push(partial) {
    const next = { text, key, bpmMin, bpmMax, ...partial };
    onFilterChange?.(next);
  }

  return (
    <div className="search-bar">
      {/* Ricerca testo */}
      <div className="search-field search-field-text">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="Cerca per nome transizione, DJ, traccia..."
          value={text}
          onChange={(e) => { setText(e.target.value); push({ text: e.target.value }); }}
        />
      </div>

      {/* Filtro Key Camelot */}
      <div className="search-field search-field-select">
        <label>Key</label>
        <select value={key} onChange={(e) => { setKey(e.target.value); push({ key: e.target.value }); }}>
          <option value="">Tutte</option>
          {CAMELOT_KEYS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Range BPM */}
      <div className="search-field search-field-select">
        <label>BPM min</label>
        <select value={bpmMin} onChange={(e) => { setBpmMin(e.target.value); push({ bpmMin: e.target.value }); }}>
          <option value="">—</option>
          {BPM_STEPS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="search-field search-field-select">
        <label>BPM max</label>
        <select value={bpmMax} onChange={(e) => { setBpmMax(e.target.value); push({ bpmMax: e.target.value }); }}>
          <option value="">—</option>
          {BPM_STEPS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {(text || key || bpmMin || bpmMax) && (
        <button
          className="search-reset"
          onClick={() => {
            setText(''); setKey(''); setBpmMin(''); setBpmMax('');
            onFilterChange?.({ text: '', key: '', bpmMin: '', bpmMax: '' });
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
