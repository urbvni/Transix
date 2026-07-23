import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CAMELOT_KEYS, BPM_STEPS } from '../lib/camelot';
import TransitionCard from '../components/TransitionCard';
import './Explore.css';

const PAGE_SIZE = 12;

export default function Explore() {
  const [transitions, setTransitions] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filtri
  const [text, setText] = useState('');
  const [genreId, setGenreId] = useState('');
  const [key, setKey] = useState('');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [sort, setSort] = useState('recent'); // 'recent' | 'oldest' | 'bpm_asc' | 'bpm_desc'

  // Fetch generi + transizioni
  useEffect(() => {
    if (!supabase) return;
    supabase.from('genres').select('*').order('name').then(({ data }) => {
      if (data) setGenres(data);
    });
  }, []);

  useEffect(() => {
    if (!supabase) return;

    async function fetchTransitions() {
      setLoading(true);

      const { data } = await supabase
        .from('transitions')
        .select(`
          id, title, key_a, key_b,
          bpm_a_original, bpm_b_original, bpm_sync,
          track_a_title, track_a_artist, track_b_title, track_b_artist,
          genre_id, created_at,
          profiles ( dj_name ),
          genres ( name )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        const normalized = data.map((t) => ({
          id: t.id,
          title: t.title,
          dj_name: t.profiles?.dj_name || 'DJ',
          track_a: { title: t.track_a_title, artist: t.track_a_artist },
          track_b: { title: t.track_b_title, artist: t.track_b_artist },
          key_a: t.key_a,
          key_b: t.key_b,
          bpm_a_original: t.bpm_a_original,
          bpm_b_original: t.bpm_b_original,
          bpm_sync: t.bpm_sync,
          genre: t.genres?.name || '',
          genre_id: t.genre_id,
          created_at: t.created_at,
        }));
        setTransitions(normalized);
      }
      setLoading(false);
    }
    fetchTransitions();
  }, []);

  // Applica filtri + ordinamento client-side (per catalogo piccolo va benissimo)
  const filteredSorted = useMemo(() => {
    let result = transitions.filter((t) => {
      if (text) {
        const q = text.toLowerCase();
        const hay = [
          t.title, t.dj_name,
          t.track_a.title, t.track_a.artist,
          t.track_b.title, t.track_b.artist,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (genreId && String(t.genre_id) !== String(genreId)) return false;
      if (key && t.key_a !== key && t.key_b !== key) return false;
      if (bpmMin && t.bpm_sync < Number(bpmMin)) return false;
      if (bpmMax && t.bpm_sync > Number(bpmMax)) return false;
      return true;
    });

    // Ordinamento
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'bpm_asc':
        result.sort((a, b) => a.bpm_sync - b.bpm_sync);
        break;
      case 'bpm_desc':
        result.sort((a, b) => b.bpm_sync - a.bpm_sync);
        break;
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [transitions, text, genreId, key, bpmMin, bpmMax, sort]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setPage(1);
  }, [text, genreId, key, bpmMin, bpmMax, sort]);

  // Paginazione
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const paginated = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFiltersCount = [text, genreId, key, bpmMin, bpmMax].filter(Boolean).length;

  function resetFilters() {
    setText(''); setGenreId(''); setKey(''); setBpmMin(''); setBpmMax('');
  }

  return (
    <div className="explore-page">
      <div className="container">

        <header className="explore-header">
          <span className="explore-eyebrow mono">CATALOGO</span>
          <h1>Esplora le transizioni</h1>
          <p>Filtra per genere, key armonica e BPM per trovare la transizione giusta per il tuo studio.</p>
        </header>

        {/* Filtri */}
        <div className="explore-filters">
          <div className="ef-search">
            <svg className="ef-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Cerca per titolo, DJ, traccia..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="ef-selects">
            <label className="ef-select">
              <span>Genere</span>
              <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
                <option value="">Tutti</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>

            <label className="ef-select">
              <span>Key</span>
              <select value={key} onChange={(e) => setKey(e.target.value)}>
                <option value="">Tutte</option>
                {CAMELOT_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>

            <label className="ef-select">
              <span>BPM min</span>
              <select value={bpmMin} onChange={(e) => setBpmMin(e.target.value)}>
                <option value="">—</option>
                {BPM_STEPS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="ef-select">
              <span>BPM max</span>
              <select value={bpmMax} onChange={(e) => setBpmMax(e.target.value)}>
                <option value="">—</option>
                {BPM_STEPS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>

            <label className="ef-select">
              <span>Ordina per</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Più recenti</option>
                <option value="oldest">Più vecchie</option>
                <option value="bpm_asc">BPM crescente</option>
                <option value="bpm_desc">BPM decrescente</option>
              </select>
            </label>

            {activeFiltersCount > 0 && (
              <button className="ef-reset" onClick={resetFilters}>
                Reset filtri
              </button>
            )}
          </div>
        </div>

        {/* Meta risultati */}
        <div className="explore-meta">
          <span className="mono">
            {loading
              ? 'Caricamento...'
              : `${filteredSorted.length} ${filteredSorted.length === 1 ? 'transizione' : 'transizioni'}`}
          </span>
          {activeFiltersCount > 0 && !loading && (
            <span className="mono explore-meta-filters">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro attivo' : 'filtri attivi'}
            </span>
          )}
        </div>

        {/* Griglia */}
        {loading ? (
          <div className="explore-empty">Caricamento...</div>
        ) : paginated.length > 0 ? (
          <>
            <div className="explore-grid">
              {paginated.map((t) => (
                <TransitionCard key={t.id} transition={t} />
              ))}
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="explore-pagination">
                <button
                  className="ep-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Precedente
                </button>
                <span className="ep-info mono">
                  Pagina {page} di {totalPages}
                </span>
                <button
                  className="ep-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Successiva →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="explore-empty">
            Nessuna transizione corrisponde ai filtri selezionati.
          </div>
        )}
      </div>
    </div>
  );
}
