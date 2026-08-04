import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError('Supabase non configurato.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-confirm">
          <div className="auth-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M4 6h16v12H4z" />
              <path d="m4 6 8 7 8-7" />
            </svg>
          </div>
          <h1 className="auth-title">Email inviata</h1>
          <p className="auth-sub">
            Ti abbiamo mandato un link a<br />
            <strong className="auth-email-highlight">{email}</strong>
          </p>
          <div className="auth-info-box">
            <p>Apri l'email e clicca sul link per impostare una nuova password. Se non arriva, controlla lo spam.</p>
          </div>
          <Link to="/login" className="auth-submit auth-submit-link">Torna al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Recupera password</h1>
        <p className="auth-sub">Inserisci l'email del tuo account. Ti manderemo un link per reimpostare la password.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Invio...' : 'Invia link di reset'}
          </button>
        </form>

        <p className="auth-alt"><Link to="/login">← Torna al login</Link></p>
      </div>
    </div>
  );
}
