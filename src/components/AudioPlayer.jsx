import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import './AudioPlayer.css';

/**
 * Player audio con waveform, basato su wavesurfer.js.
 * Props:
 *   - url: URL del file audio da riprodurre
 */
export default function AudioPlayer({ url }) {
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    // Legge il colore accento dal CSS (per coerenza col brand)
    const styles = getComputedStyle(document.documentElement);
    const accentB = styles.getPropertyValue('--accent-b').trim() || '#ff7a3d';
    const border = styles.getPropertyValue('--border').trim() || '#2a2a2e';

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: border,
      progressColor: accentB,
      cursorColor: '#fff',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 80,
      normalize: true,
      url,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      setReady(true);
      setDuration(ws.getDuration());
    });
    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));
    ws.on('timeupdate', (t) => setCurrentTime(t));

    return () => ws.destroy();
  }, [url]);

  function togglePlay() {
    if (!wsRef.current || !ready) return;
    wsRef.current.playPause();
  }

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <button
        className="audio-play-btn"
        onClick={togglePlay}
        disabled={!ready}
        aria-label={playing ? 'Pausa' : 'Riproduci'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="audio-wave-wrap">
        <div className="audio-wave" ref={containerRef}></div>
        <div className="audio-time mono">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
