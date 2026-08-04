import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError('Le due password non coincidono.');
      return;
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert('Password aggiornata. Effettua nuovamente il login.');
      await supabase.auth.signOut();
      navigate('/login');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Nuova password</h1>
        <p className="auth-sub">Imposta una nuova password per il tuo account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Nuova password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <label className="auth-field">
            <span>Conferma password</span>
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength={6} />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Aggiornamento...' : 'Aggiorna password'}
          </button>
        </form>
      </div>
    </div>
  );
}
