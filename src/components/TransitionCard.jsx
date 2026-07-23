import { Link } from 'react-router-dom';
import { isMinorKey } from '../lib/camelot';
import './TransitionCard.css';

export default function TransitionCard({ transition }) {
  const t = transition;
  const keyAClass = isMinorKey(t.key_a) ? 'key key-minor' : 'key key-major';
  const keyBClass = isMinorKey(t.key_b) ? 'key key-minor' : 'key key-major';

  return (
    <Link to={`/t/${t.id}`} className="tcard-link">
      <article className="tcard">
        <div className="tcard-play">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        <h3 className="tcard-title">{t.title}</h3>

        <div className="tcard-tracks">
          <div className="tcard-track">
            <span className="tcard-track-label">A</span>
            <span className="tcard-track-title">{t.track_a.title}</span>
            <span className="tcard-track-artist">{t.track_a.artist}</span>
          </div>
          <div className="tcard-track">
            <span className="tcard-track-label">B</span>
            <span className="tcard-track-title">{t.track_b.title}</span>
            <span className="tcard-track-artist">{t.track_b.artist}</span>
          </div>
        </div>

        <div className="tcard-keys">
          <span className={keyAClass}>{t.key_a}</span>
          <span className="key-arrow">→</span>
          <span className={keyBClass}>{t.key_b}</span>
        </div>

        <div className="tcard-meta">
          <span className="mono tcard-bpm">
            {t.bpm_a_original} → {t.bpm_b_original} @ {t.bpm_sync}
          </span>
          <span className="tcard-dj">by {t.dj_name}</span>
        </div>

        {/* Counter like + commenti */}
        <div className="tcard-stats">
          <span className="tcard-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="mono">{t.likes_count ?? 0}</span>
          </span>
          <span className="tcard-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="mono">{t.comments_count ?? 0}</span>
          </span>
        </div>
      </article>
    </Link>
  );
}
