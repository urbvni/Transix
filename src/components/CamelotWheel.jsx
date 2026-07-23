import { useState, useRef, useEffect } from 'react';
import './CamelotWheel.css';

// 12 posizioni, ogni una con key A (minore) e B (maggiore)
// Notazione musicale reale per ogni Camelot key
const KEYS = [
  { num: 1, minor: 'Ab minor', major: 'B major' },
  { num: 2, minor: 'Eb minor', major: 'F# major' },
  { num: 3, minor: 'Bb minor', major: 'Db major' },
  { num: 4, minor: 'F minor', major: 'Ab major' },
  { num: 5, minor: 'C minor', major: 'Eb major' },
  { num: 6, minor: 'G minor', major: 'Bb major' },
  { num: 7, minor: 'D minor', major: 'F major' },
  { num: 8, minor: 'A minor', major: 'C major' },
  { num: 9, minor: 'E minor', major: 'G major' },
  { num: 10, minor: 'B minor', major: 'D major' },
  { num: 11, minor: 'F# minor', major: 'A major' },
  { num: 12, minor: 'Db minor', major: 'E major' },
];

/**
 * Ruota Camelot 3D interattiva.
 * - Click su una key → la seleziona, evidenzia le compatibili
 * - Mouse move → tilt 3D leggero
 * - Callback opzionale onKeyChange(key) per notificare la selezione al parent
 */
export default function CamelotWheel({ selectedKey, onKeyChange }) {
  const [internalKey, setInternalKey] = useState('8A');
  const [hoverKey, setHoverKey] = useState(null);
  const sceneRef = useRef(null);
  const wheelRef = useRef(null);

  const activeKey = selectedKey || internalKey;

  useEffect(() => {
    const scene = sceneRef.current;
    const wheel = wheelRef.current;
    if (!scene || !wheel) return;

    function onMove(e) {
      const rect = scene.getBoundingClientRect();
      const cx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const cy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      wheel.style.setProperty('--tilt-x', (-cy * 15) + 'deg');
      wheel.style.setProperty('--tilt-y', (cx * 20) + 'deg');
    }

    scene.addEventListener('mousemove', onMove);
    scene.addEventListener('mouseleave', () => {
      wheel.style.setProperty('--tilt-x', '0deg');
      wheel.style.setProperty('--tilt-y', '0deg');
    });

    return () => scene.removeEventListener('mousemove', onMove);
  }, []);

  function selectKey(k) {
    if (onKeyChange) onKeyChange(k);
    else setInternalKey(k);
  }

  // Regole compatibilità: stesso key, +1, -1, cambia lettera stesso numero
  function isCompatible(k) {
    if (!activeKey) return false;
    const activeNum = parseInt(activeKey);
    const activeLetter = activeKey.slice(-1);
    const num = parseInt(k);
    const letter = k.slice(-1);

    if (k === activeKey) return false; // se stessa key, non evidenziare come "compatibile"
    if (letter === activeLetter) {
      const diff = Math.abs(num - activeNum);
      if (diff === 1 || diff === 11) return 'adjacent'; // ±1 sulla ruota (wrap around)
    }
    if (num === activeNum && letter !== activeLetter) return 'relative'; // stesso numero, altra lettera
    return false;
  }

  // Calcola posizioni SVG delle 12 sezioni
  const centerX = 250;
  const centerY = 250;
  const rOuter = 240;    // esterno anello major (B)
  const rMid = 175;      // separazione major/minor
  const rInner = 105;    // interno anello minor (A)
  const rHole = 55;      // foro centrale

  function polar(cx, cy, r, angle) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function segmentPath(rInn, rOut, startAngle, endAngle) {
    const p1 = polar(centerX, centerY, rOut, startAngle);
    const p2 = polar(centerX, centerY, rOut, endAngle);
    const p3 = polar(centerX, centerY, rInn, endAngle);
    const p4 = polar(centerX, centerY, rInn, startAngle);
    return `M ${p1.x} ${p1.y}
            A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y}
            L ${p3.x} ${p3.y}
            A ${rInn} ${rInn} 0 0 0 ${p4.x} ${p4.y}
            Z`;
  }

  const info = KEYS.find((k) => k.num === parseInt(activeKey)) || KEYS[7];
  const activeLetter = activeKey?.slice(-1);
  const activeNote = activeLetter === 'A' ? info.minor : info.major;

  return (
    <div className="cw-container">
      <div className="cw-scene" ref={sceneRef}>
        <div className="cw-glow" aria-hidden="true"></div>
        <div className="cw-wheel" ref={wheelRef}>
          <svg viewBox="0 0 500 500" className="cw-svg">
            <defs>
              <filter id="cw-shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.5"/>
              </filter>
            </defs>

            {KEYS.map((keyInfo, i) => {
              // Segment start-end angles (12 sezioni, partiamo da -90° = top)
              const anglePerSection = (Math.PI * 2) / 12;
              const start = -Math.PI / 2 - anglePerSection / 2 + i * anglePerSection;
              const end = start + anglePerSection;
              const mid = (start + end) / 2;

              const keyA = `${keyInfo.num}A`;
              const keyB = `${keyInfo.num}B`;

              const compA = isCompatible(keyA);
              const compB = isCompatible(keyB);
              const activeA = activeKey === keyA;
              const activeB = activeKey === keyB;
              const hoverA = hoverKey === keyA;
              const hoverB = hoverKey === keyB;

              // Etichette
              const labelPosB = polar(centerX, centerY, (rMid + rOuter) / 2, mid);
              const labelPosA = polar(centerX, centerY, (rInner + rMid) / 2, mid);

              return (
                <g key={i}>
                  {/* Segmento B (esterno, MAJOR) */}
                  <path
                    d={segmentPath(rMid, rOuter, start, end)}
                    className={`cw-seg cw-seg-b ${activeB ? 'cw-seg-active' : ''} ${compB ? `cw-seg-comp cw-seg-comp-${compB}` : ''} ${hoverB ? 'cw-seg-hover' : ''}`}
                    onClick={() => selectKey(keyB)}
                    onMouseEnter={() => setHoverKey(keyB)}
                    onMouseLeave={() => setHoverKey(null)}
                  />
                  {/* Segmento A (interno, MINOR) */}
                  <path
                    d={segmentPath(rInner, rMid, start, end)}
                    className={`cw-seg cw-seg-a ${activeA ? 'cw-seg-active' : ''} ${compA ? `cw-seg-comp cw-seg-comp-${compA}` : ''} ${hoverA ? 'cw-seg-hover' : ''}`}
                    onClick={() => selectKey(keyA)}
                    onMouseEnter={() => setHoverKey(keyA)}
                    onMouseLeave={() => setHoverKey(null)}
                  />
                  {/* Etichette */}
                  <text x={labelPosB.x} y={labelPosB.y} className="cw-label cw-label-b" pointerEvents="none">
                    {keyB}
                  </text>
                  <text x={labelPosA.x} y={labelPosA.y} className="cw-label cw-label-a" pointerEvents="none">
                    {keyA}
                  </text>
                </g>
              );
            })}

            {/* Centro con key attiva */}
            <circle cx={centerX} cy={centerY} r={rHole + 40} className="cw-center-outer" />
            <circle cx={centerX} cy={centerY} r={rHole + 40} className="cw-center-ring" />
            <text x={centerX} y={centerY - 6} className="cw-center-key" pointerEvents="none">
              {activeKey}
            </text>
            <text x={centerX} y={centerY + 20} className="cw-center-note" pointerEvents="none">
              {activeNote}
            </text>
          </svg>
        </div>
      </div>

      <div className="cw-legend">
        <div className="cw-legend-item">
          <span className="cw-dot cw-dot-active"></span>
          <span>Key selezionata</span>
        </div>
        <div className="cw-legend-item">
          <span className="cw-dot cw-dot-adjacent"></span>
          <span>Adiacenti (±1): compatibili energeticamente</span>
        </div>
        <div className="cw-legend-item">
          <span className="cw-dot cw-dot-relative"></span>
          <span>Stesso numero, altra modalità (A↔B): stessa tonalità relativa</span>
        </div>
      </div>
    </div>
  );
}
