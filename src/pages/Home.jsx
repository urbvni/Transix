import { useEffect, useMemo, useState } from 'react';
import Vinyl from '../components/Vinyl';
import SearchBar from '../components/SearchBar';
import TransitionCard from '../components/TransitionCard';
import { MOCK_TRANSITIONS } from '../lib/mockData';
import { supabase } from '../lib/supabase';
import { attachCounts } from '../lib/counts';
import './Home.css';

export default function Home() {
  const [filters, setFilters] = useState({ text: '', key: '', bpmMin: '', bpmMax: '' });
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('loading');

  useEffect(() => {
    async function fetchTransitions() {
      if (!supabase) {
        setTransitions(MOCK_TRANSITIONS);
        setSource('mock');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('transitions')
        .select(`
          id, title, description, audio_url,
          key_a, key_b, bpm_a_original, bpm_b_original, bpm_sync,
          track_a_title, track_a_artist, track_b_title, track_b_artist,
          created_at,
          profiles ( dj_name ),
          genres ( name )
        `)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setTransitions(MOCK_TRANSITIONS);
        setSource('mock');
      } else {
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
          audio_url: t.audio_url,
        }));
        const withCounts = await attachCounts(normalized);
        setTransitions(withCounts);
        setSource('db');
      }
      setLoading(false);
    }
    fetchTransitions();
  }, []);

  const filtered = useMemo(() => {
    return transitions.filter((t) => {
      if (filters.text) {
        const q = filters.text.toLowerCase();
        const hay = [
          t.title, t.dj_name,
          t.track_a.title, t.track_a.artist,
          t.track_b.title, t.track_b.artist,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.key && t.key_a !== filters.key && t.key_b !== filters.key) return false;
      if (filters.bpmMin && t.bpm_sync < Number(filters.bpmMin)) return false;
      if (filters.bpmMax && t.bpm_sync > Number(filters.bpmMax)) return false;
      return true;
    });
  }, [transitions, filters]);

  return (
    <div className="home">
      <section className="hero">
        <div className="grid-bg"></div>
        <div className="container hero-inner">
          <div className="hero-vinyl">
            <Vinyl />
          </div>
          <div className="hero-text">
            <span className="hero-eyebrow">Libreria di transizioni</span>
            <h1 className="hero-title">
              Non il set.<br />
              <span className="hero-title-accent">Il cambio.</span>
            </h1>
            <p className="hero-sub">
              Il punto esatto in cui due tracce diventano una. Uno strumento
              di studio per il mixing armonico: ogni transizione con la sua
              chiave Camelot, i suoi BPM, il suo carattere.
            </p>
          </div>
        </div>
      </section>

      <section className="results">
        <div className="container">
          <SearchBar onFilterChange={setFilters} />

          <div className="results-meta">
            <span className="mono">
              {loading
                ? 'Caricamento...'
                : `${filtered.length} ${filtered.length === 1 ? 'transizione' : 'transizioni'}`}
            </span>
            {source === 'mock' && !loading && (
              <span className="results-hint mono">Esempi (nessuna transizione ancora caricata)</span>
            )}
          </div>

          {!loading && filtered.length > 0 ? (
            <div className="results-grid">
              {filtered.map((t) => (
                <TransitionCard key={t.id} transition={t} />
              ))}
            </div>
          ) : !loading && (
            <div className="results-empty">
              Nessuna transizione corrisponde ai filtri selezionati.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
