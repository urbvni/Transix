import { useState } from 'react';
import { Link } from 'react-router-dom';
import CamelotWheel from '../components/CamelotWheel';
import './HowItWorks.css';

export default function HowItWorks() {
  const [selected, setSelected] = useState('8A');

  return (
    <div className="how-page">
      <div className="container">

        {/* Intro */}
        <header className="how-header">
          <span className="how-eyebrow mono">GUIDA</span>
          <h1>Come funziona la ruota Camelot</h1>
          <p className="how-lead">
            La Camelot Wheel è uno strumento visivo che semplifica il mixaggio armonico:
            mixare due tracce in tonalità compatibili produce transizioni più naturali,
            senza dissonanze percepibili. Ogni tonalità musicale è tradotta in un codice
            numero + lettera <span className="mono">(8A, 11B, ...)</span>.
          </p>
        </header>

        {/* Ruota interattiva */}
        <section className="how-wheel-section">
          <div className="how-wheel-intro">
            <h2>Prova la ruota</h2>
            <p>
              Clicca una qualsiasi key per selezionarla. Le key <strong>compatibili</strong>
              si illuminano automaticamente. Muovi il mouse sopra la ruota per vedere
              l'effetto 3D.
            </p>
          </div>
          <CamelotWheel selectedKey={selected} onKeyChange={setSelected} />
        </section>

        {/* Regole */}
        <section className="how-rules">
          <h2>Le tre regole del mixaggio armonico</h2>

          <div className="how-rule">
            <div className="how-rule-num mono">01</div>
            <div className="how-rule-body">
              <h3>Stessa key</h3>
              <p>
                La transizione più sicura: se entrambe le tracce sono nella stessa key
                (es. <span className="mono">8A → 8A</span>), sono perfettamente
                compatibili. Nessuna dissonanza, cambio energetico minimo.
              </p>
            </div>
          </div>

          <div className="how-rule">
            <div className="how-rule-num mono">02</div>
            <div className="how-rule-body">
              <h3>Adiacenti sulla ruota (±1)</h3>
              <p>
                Spostarsi al numero successivo o precedente mantenendo la stessa
                lettera <span className="mono">(8A → 9A o 8A → 7A)</span> sposta la tonalità di una
                quinta giusta. È la modulazione classica: il pubblico avverte
                un progresso senza percepire uno stacco.
              </p>
            </div>
          </div>

          <div className="how-rule">
            <div className="how-rule-num mono">03</div>
            <div className="how-rule-body">
              <h3>Stesso numero, cambia lettera</h3>
              <p>
                Passare da <span className="mono">8A a 8B</span> (o viceversa) significa
                cambiare la modalità (da minore a maggiore o viceversa) restando
                nella stessa tonalità relativa. Ottimo per creare un cambio di
                atmosfera senza rompere l'armonia.
              </p>
            </div>
          </div>
        </section>

        {/* Notazione */}
        <section className="how-notation">
          <h2>Cosa significano i codici</h2>
          <div className="how-notation-grid">
            <div className="how-note-card">
              <span className="how-note-key mono how-note-key-a">A</span>
              <div>
                <h3>Lettera A</h3>
                <p>Indica una tonalità <strong>minore</strong>. Sound più cupo, malinconico, introspettivo.</p>
              </div>
            </div>
            <div className="how-note-card">
              <span className="how-note-key mono how-note-key-b">B</span>
              <div>
                <h3>Lettera B</h3>
                <p>Indica una tonalità <strong>maggiore</strong>. Sound più aperto, luminoso, energico.</p>
              </div>
            </div>
            <div className="how-note-card">
              <span className="how-note-key mono how-note-key-num">1-12</span>
              <div>
                <h3>Numero</h3>
                <p>Rappresenta la posizione sulla ruota. Muoversi lungo i numeri = muoversi per quinte.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="how-cta">
          <h2>Pronto a caricare la tua prima transizione?</h2>
          <p>Applica quello che hai imparato: registra un cambio armonico e condividilo.</p>
          <Link to="/upload" className="how-cta-btn">Carica una transizione</Link>
        </section>

      </div>
    </div>
  );
}
