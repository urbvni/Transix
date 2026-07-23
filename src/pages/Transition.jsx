import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isMinorKey } from '../lib/camelot';
import AudioPlayer from '../components/AudioPlayer';
import './Transition.css';

export default function Transition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transition, setTransition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!supabase || !id) return;

    async function fetchTransition() {
      setLoading(true);
      const { data, error } = await supabase
        .from('transitions')
        .select(`
          *,
          profiles ( id, dj_name, bio ),
          genres ( name )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        setError('Transizione non trovata.');
      } else {
        setTransition(data);
      }
      setLoading(false);
    }
    fetchTransition();
  }, [id]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;
  }
  if (error || !transition) {
    return (
      <div className="container" style={{ padding: 80, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>Transizione non trovata</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
          Non riusciamo a caricare questa transizione.
        </p>
        <button onClick={() => navigate('/')} className="link-btn">Torna alla home</button>
      </div>
    );
  }

  const t = transition;
  const keyAClass = isMinorKey(t.key_a) ? 'key key-minor' : 'key key-major';
  const keyBClass = isMinorKey(t.key_b) ? 'key key-minor' : 'key key-major';

  return (
    <div className="transition-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="tp-crumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Transizione</span>
        </nav>

        <header className="tp-header">
          <div className="tp-title-wrap">
            {t.genres?.name && <span className="tp-genre">{t.genres.name}</span>}
            <h1 className="tp-title">{t.title}</h1>
            <p className="tp-by">
              di <Link to={`/dj/${t.profiles?.id}`} className="tp-dj-link">{t.profiles?.dj_name || 'DJ'}</Link>
            </p>
          </div>
          <button className="tp-share" onClick={handleShare}>
            {copied ? '✓ Link copiato' : 'Condividi'}
          </button>
        </header>

        {/* Player */}
        <div className="tp-player">
          <AudioPlayer url={t.audio_url} />
        </div>

        {/* Tracce */}
        <div className="tp-tracks">
          <div className="tp-track">
            <div className="tp-track-head">
              <span className="track-label track-label-a">A</span>
              <span className="tp-track-role">Traccia in uscita</span>
            </div>
            <div className="tp-track-body">
              <div className="tp-track-title">{t.track_a_title}</div>
              <div className="tp-track-artist">{t.track_a_artist}</div>
              <div className="tp-track-meta">
                <span className={keyAClass}>{t.key_a}</span>
                <span className="mono tp-bpm">{t.bpm_a_original} BPM</span>
              </div>
            </div>
          </div>

          <div className="tp-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>

          <div className="tp-track">
            <div className="tp-track-head">
              <span className="track-label track-label-b">B</span>
              <span className="tp-track-role">Traccia in ingresso</span>
            </div>
            <div className="tp-track-body">
              <div className="tp-track-title">{t.track_b_title}</div>
              <div className="tp-track-artist">{t.track_b_artist}</div>
              <div className="tp-track-meta">
                <span className={keyBClass}>{t.key_b}</span>
                <span className="mono tp-bpm">{t.bpm_b_original} BPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info tecniche */}
        <div className="tp-info">
          <div className="tp-info-item">
            <span className="tp-info-label mono">BPM SYNC</span>
            <span className="tp-info-value mono">{t.bpm_sync}</span>
          </div>
          <div className="tp-info-item">
            <span className="tp-info-label mono">DURATA</span>
            <span className="tp-info-value mono">{t.audio_duration_seconds}s</span>
          </div>
          <div className="tp-info-item">
            <span className="tp-info-label mono">CAMBIO KEY</span>
            <span className="tp-info-value mono">{t.key_a} → {t.key_b}</span>
          </div>
        </div>

        {t.description && (
          <div className="tp-description">
            <h2>Note</h2>
            <p>{t.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
