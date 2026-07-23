import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [djName, setDjName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!supabase) {
      setError('Supabase non configurato. Controlla il file .env e riavvia il server.');
      setLoading(false);
      return;
    }

    // Il dj_name viene passato nei raw_user_meta_data:
    // il trigger SQL "handle_new_user" lo legge e crea il record in profiles.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { dj_name: djName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Se la verifica email è disattivata (default in dev), l'utente viene loggato subito.
      // Se è attiva, avvertiamo di controllare la mail.
      setMessage('Registrazione completata. Se non vieni reindirizzato, controlla la tua email per confermare l\'account.');
      setLoading(false);
      // Piccolo delay per far leggere il messaggio, poi torniamo alla home
      setTimeout(() => navigate('/'), 2500);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Crea il tuo account</h1>
        <p className="auth-sub">Inizia a caricare le tue transizioni</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Nome d'arte DJ</span>
            <input
              type="text"
              value={djName}
              onChange={(e) => setDjName(e.target.value)}
              required
              minLength={2}
              maxLength={30}
              placeholder="es. Urbani"
            />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <small className="auth-hint">Almeno 6 caratteri</small>
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
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
