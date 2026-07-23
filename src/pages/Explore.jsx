import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CAMELOT_KEYS, BPM_STEPS } from '../lib/camelot';
import { attachCounts } from '../lib/counts';
import TransitionCard from '../components/TransitionCard';
import './Explore.css';

const PAGE_SIZE = 12;

export default function Explore() {
  const [tab, setTab] = useState('transitions'); // 'transitions' | 'djs'

  // Stato transizioni
  const [transitions, setTransitions] = useState([]);
  const [genres, setGenres] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filtri transizioni
  const [text, setText] = useState('');
  const [genreId, setGenreId] = useState('');
  const [key, setKey] = useState('');
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [sort, setSort] = useState('recent');

  // Stato DJ
  const [djs, setDjs] = useState([]);
  const [djsLoading, setDjsLoading] = useState(true);
  const [djSearch, setDjSearch] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.from('genres').select('*').order('name').then(({ data }) => {
      if (data) setGenres(data);
    });
  }, []);

  // Fetch transizioni
  useEffect(() => {
    if (!supabase) return;
    async function fetch() {
      setTxLoading(true);
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
          key_a: t.key_a, key_b: t.key_b,
          bpm_a_original: t.bpm_a_original,
          bpm_b_original: t.bpm_b_original,
          bpm_sync: t.bpm_sync,
          genre: t.genres?.name || '',
          genre_id: t.genre_id,
          created_at: t.created_at,
        }));
        setTransitions(await attachCounts(normalized));
      }
      setTxLoading(false);
    }
    fetch();
  }, []);

  // Fetch DJ (tutti i profili)
  useEffect(() => {
    if (!supabase) return;
    async function fetch() {
      setDjsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, dj_name, bio, avatar_url')
        .order('dj_name');
      if (data) {
        // Conta upload per ogni DJ (batch)
        const ids = data.map((d) => d.id);
        const { data: txCounts } = await supabase.from('transitions').select('dj_id').in('dj_id', ids);
        const countMap = {};
        (txCounts || []).forEach((t) => { countMap[t.dj_id] = (countMap[t.dj_id] || 0) + 1; });
        setDjs(data.map((d) => ({ ...d, transitions_count: countMap[d.id] || 0 })));
      }
      setDjsLoading(false);
    }
    fetch();
  }, []);

  const filteredSortedTx = useMemo(() => {
    let result = transitions.filter((t) => {
      if (text) {
        const q = text.toLowerCase();
        const hay = [t.title, t.dj_name, t.track_a.title, t.track_a.artist, t.track_b.title, t.track_b.artist].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (genreId && String(t.genre_id) !== String(genreId)) return false;
      if (key && t.key_a !== key && t.key_b !== key) return false;
      if (bpmMin && t.bpm_sync < Number(bpmMin)) return false;
      if (bpmMax && t.bpm_sync > Number(bpmMax)) return false;
      return true;
    });
    switch (sort) {
      case 'oldest': result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'bpm_asc': result.sort((a, b) => a.bpm_sync - b.bpm_sync); break;
      case 'bpm_desc': result.sort((a, b) => b.bpm_sync - a.bpm_sync); break;
      default: result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [transitions, text, genreId, key, bpmMin, bpmMax, sort]);

  const filteredDjs = useMemo(() => {
    if (!djSearch) return djs;
    const q = djSearch.toLowerCase();
    return djs.filter((d) =>
      d.dj_name?.toLowerCase().includes(q) ||
      d.bio?.toLowerCase().includes(q)
    );
  }, [djs, djSearch]);

  useEffect(() => { setPage(1); }, [text, genreId, key, bpmMin, bpmMax, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedTx.length / PAGE_SIZE));
  const paginated = filteredSortedTx.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeFiltersCount = [text, genreId, key, bpmMin, bpmMax].filter(Boolean).length;

  function resetFilters() {
    setText(''); setGenreId(''); setKey(''); setBpmMin(''); setBpmMax('');
  }

  return (
    <div className="explore-page">
      <div className="container">

        <header className="explore-header">
          <span className="explore-eyebrow mono">CATALOGO</span>
          <h1>Esplora</h1>
          <p>Trova transizioni per key, BPM e genere, oppure sfoglia i DJ della community.</p>
        </header>

        {/* Tabs */}
        <div className="explore-tabs">
          <button
            className={`explore-tab ${tab === 'transitions' ? 'explore-tab-active' : ''}`}
            onClick={() => setTab('transitions')}
          >
            Transizioni <span className="mono">{transitions.length}</span>
          </button>
          <button
            className={`explore-tab ${tab === 'djs' ? 'explore-tab-active' : ''}`}
            onClick={() => setTab('djs')}
          >
            DJ <span className="mono">{djs.length}</span>
          </button>
        </div>

        {tab === 'transitions' && (
          <>
            {/* Filtri */}
            <div className="explore-filters">
              <div className="ef-search">
                <svg className="ef-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input type="text" placeholder="Cerca per titolo, DJ, traccia..." value={text} onChange={(e) => setText(e.target.value)} />
              </div>
              <div className="ef-selects">
                <label className="ef-select"><span>Genere</span>
                  <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
                    <option value="">Tutti</option>
                    {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </label>
                <label className="ef-select"><span>Key</span>
                  <select value={key} onChange={(e) => setKey(e.target.value)}>
                    <option value="">Tutte</option>
                    {CAMELOT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <label className="ef-select"><span>BPM min</span>
                  <select value={bpmMin} onChange={(e) => setBpmMin(e.target.value)}>
                    <option value="">—</option>
                    {BPM_STEPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="ef-select"><span>BPM max</span>
                  <select value={bpmMax} onChange={(e) => setBpmMax(e.target.value)}>
                    <option value="">—</option>
                    {BPM_STEPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="ef-select"><span>Ordina per</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="recent">Più recenti</option>
                    <option value="oldest">Più vecchie</option>
                    <option value="bpm_asc">BPM crescente</option>
                    <option value="bpm_desc">BPM decrescente</option>
                  </select>
                </label>
                {activeFiltersCount > 0 && <button className="ef-reset" onClick={resetFilters}>Reset filtri</button>}
              </div>
            </div>

            <div className="explore-meta">
              <span className="mono">
                {txLoading ? 'Caricamento...' : `${filteredSortedTx.length} ${filteredSortedTx.length === 1 ? 'transizione' : 'transizioni'}`}
              </span>
              {activeFiltersCount > 0 && !txLoading && (
                <span className="mono explore-meta-filters">
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro attivo' : 'filtri attivi'}
                </span>
              )}
            </div>

            {txLoading ? (
              <div className="explore-empty">Caricamento...</div>
            ) : paginated.length > 0 ? (
              <>
                <div className="explore-grid">
                  {paginated.map((t) => <TransitionCard key={t.id} transition={t} />)}
                </div>
                {totalPages > 1 && (
                  <div className="explore-pagination">
                    <button className="ep-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Precedente</button>
                    <span className="ep-info mono">Pagina {page} di {totalPages}</span>
                    <button className="ep-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Successiva →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="explore-empty">Nessuna transizione corrisponde ai filtri selezionati.</div>
            )}
          </>
        )}

        {tab === 'djs' && (
          <>
            <div className="explore-filters">
              <div className="ef-search">
                <svg className="ef-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input type="text" placeholder="Cerca per nome DJ..." value={djSearch} onChange={(e) => setDjSearch(e.target.value)} />
              </div>
            </div>

            <div className="explore-meta">
              <span className="mono">
                {djsLoading ? 'Caricamento...' : `${filteredDjs.length} ${filteredDjs.length === 1 ? 'DJ' : 'DJ'}`}
              </span>
            </div>

            {djsLoading ? (
              <div className="explore-empty">Caricamento...</div>
            ) : filteredDjs.length > 0 ? (
              <div className="djs-grid">
                {filteredDjs.map((d) => (
                  <Link key={d.id} to={`/dj/${d.id}`} className="dj-card">
                    <div className="dj-avatar">
                      {d.avatar_url ? (
                        <img src={d.avatar_url} alt={d.dj_name} />
                      ) : (
                        <span>{d.dj_name?.[0]?.toUpperCase() || 'D'}</span>
                      )}
                    </div>
                    <div className="dj-info">
                      <h3 className="dj-name">{d.dj_name}</h3>
                      {d.bio && <p className="dj-bio">{d.bio}</p>}
                      <span className="mono dj-stat">
                        {d.transitions_count} {d.transitions_count === 1 ? 'transizione' : 'transizioni'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="explore-empty">Nessun DJ trovato.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
