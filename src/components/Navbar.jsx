import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Chiudi il menu se clicchi fuori
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = profile?.dj_name?.[0]?.toUpperCase() || 'D';

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">transix</Link>
        <div className="nav-links">
          <Link to="/explore">Esplora</Link>
          <Link to="/how">Come funziona</Link>

          {user ? (
            <>
              <Link to="/upload" className="nav-cta">Carica</Link>
              <div className="nav-user-wrap" ref={menuRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu utente"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.dj_name} />
                  ) : (
                    <span className="nav-avatar-fallback">{initial}</span>
                  )}
                </button>

                {menuOpen && (
                  <div className="nav-menu">
                    <div className="nav-menu-head">
                      <div className="nav-menu-name">{profile?.dj_name || 'DJ'}</div>
                      <div className="nav-menu-email">{user.email}</div>
                    </div>
                    <div className="nav-menu-divider"></div>
                    <Link to={`/dj/${user.id}`} className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      Il mio profilo
                    </Link>
                    <Link to="/settings" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      Impostazioni
                    </Link>
                    <div className="nav-menu-divider"></div>
                    <button
                      className="nav-menu-item nav-menu-item-btn"
                      onClick={() => { setMenuOpen(false); signOut(); }}
                    >
                      Esci
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-plain">Accedi</Link>
              <Link to="/signup" className="nav-cta">Registrati</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
