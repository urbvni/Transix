import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [djName, setDjName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!privacy) {
      setError('Devi accettare la privacy policy per continuare.');
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError('Supabase non configurato.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { dj_name: djName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      navigate('/');
    } else {
      setSignupEmail(email);
      setLoading(false);
    }
  }

  if (signupEmail) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-confirm">
          <div className="auth-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M4 6h16v12H4z" />
              <path d="m4 6 8 7 8-7" />
            </svg>
          </div>
          <h1 className="auth-title">Controlla la tua email</h1>
          <p className="auth-sub">
            Ti abbiamo inviato un link di conferma a<br />
            <strong className="auth-email-highlight">{signupEmail}</strong>
          </p>
          <div className="auth-info-box">
            <p>
              Apri l'email e clicca sul link <strong>"Confirm your signup"</strong> per attivare
              il tuo account. Dopo la conferma potrai accedere.
            </p>
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dimmer)' }}>
              Non trovi l'email? Controlla la cartella spam.
            </p>
          </div>
          <Link to="/login" className="auth-submit auth-submit-link">Vai al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Crea il tuo account</h1>
        <p className="auth-sub">Inizia a caricare le tue transizioni</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Nome d'arte DJ</span>
            <input type="text" value={djName} onChange={(e) => setDjName(e.target.value)} required minLength={2} maxLength={30} placeholder="es. Urbani" />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
            <small className="auth-hint">Almeno 6 caratteri</small>
          </label>

          <label className="auth-checkbox">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
            <span>
              Accetto la <a href="#" target="_blank" rel="noopener noreferrer">privacy policy</a>
            </span>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading || !privacy}>
            {loading ? 'Creazione in corso...' : 'Registrati'}
          </button>
        </form>

        <p className="auth-alt">
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
