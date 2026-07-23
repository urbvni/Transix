import { useEffect, useRef } from 'react';
import './Vinyl.css';

/**
 * Vinile 3D dettagliato in CSS puro.
 * - Solchi realizzati con repeating-radial-gradient a densità variabile
 * - Riflesso di luce che ruota attorno al disco
 * - Label centrale con gradiente brand
 * - Parallax leggero: il vinile si inclina seguendo il mouse
 */
export default function Vinyl() {
  const sceneRef = useRef(null);
  const discRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const disc = discRef.current;
    if (!scene || !disc) return;

    function onMove(e) {
      const rect = scene.getBoundingClientRect();
      // Normalizzato tra -1 e 1 rispetto al centro dello schermo
      const cx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const cy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      // L'inclinazione base è 55deg su X; aggiungiamo un piccolo tilt dinamico
      const tiltX = 55 - cy * 8;      // muove su/giù
      const tiltY = cx * 12;          // muove sinistra/destra
      disc.style.setProperty('--tilt-x', tiltX + 'deg');
      disc.style.setProperty('--tilt-y', tiltY + 'deg');
    }

    function onLeave() {
      disc.style.setProperty('--tilt-x', '55deg');
      disc.style.setProperty('--tilt-y', '0deg');
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="vinyl-scene" ref={sceneRef}>
      {/* Alone colorato dietro il disco */}
      <div className="vinyl-halo" aria-hidden="true"></div>

      <div className="vinyl-disc" ref={discRef}>
        {/* Corpo del disco: 3 layer di solchi a densità diverse */}
        <div className="vinyl-body">
          <div className="vinyl-grooves-outer"></div>
          <div className="vinyl-grooves-mid"></div>
          <div className="vinyl-grooves-inner"></div>
          <div className="vinyl-shine"></div>
        </div>

        {/* Etichetta centrale */}
        <div className="vinyl-label">
          <span className="vinyl-label-text">TRANSIX</span>
          <span className="vinyl-label-sub">33 RPM</span>
        </div>

        {/* Spindle (foro centrale) */}
        <div className="vinyl-spindle"></div>
      </div>

      {/* Ombra proiettata sotto */}
      <div className="vinyl-shadow" aria-hidden="true"></div>
    </div>
  );
}
