import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  // Chiudi dropdown utente quando clicchi fuori
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Chiudi hamburger menu al cambio pagina
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Blocca lo scroll del body quando il menu mobile è aperto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const initial = profile?.dj_name?.[0]?.toUpperCase() || 'D';

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">transix</Link>

          {/* Link desktop */}
          <div className="nav-links nav-links-desktop">
            <Link to="/explore">Esplora</Link>
            <Link to="/how">Come funziona</Link>

            {user ? (
              <>
                <Link to="/upload" className="nav-cta">Carica</Link>
                <div className="nav-user-wrap" ref={userMenuRef}>
                  <button
                    className="nav-avatar-btn"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-label="Menu utente"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.dj_name} />
                    ) : (
                      <span className="nav-avatar-fallback">{initial}</span>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="nav-menu">
                      <div className="nav-menu-head">
                        <div className="nav-menu-name">{profile?.dj_name || 'DJ'}</div>
                        <div className="nav-menu-email">{user.email}</div>
                      </div>
                      <div className="nav-menu-divider"></div>
                      <Link to={`/dj/${user.id}`} className="nav-menu-item" onClick={() => setUserMenuOpen(false)}>
                        Il mio profilo
                      </Link>
                      <Link to="/settings" className="nav-menu-item" onClick={() => setUserMenuOpen(false)}>
                        Impostazioni
                      </Link>
                      <div className="nav-menu-divider"></div>
                      <button
                        className="nav-menu-item nav-menu-item-btn"
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
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

          {/* Hamburger button (mobile only) */}
          <button
            className={`nav-burger ${mobileOpen ? 'nav-burger-open' : ''}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`nav-mobile ${mobileOpen ? 'nav-mobile-open' : ''}`}>
        <div className="nav-mobile-inner">
          {user && (
            <div className="nav-mobile-user">
              <div className="nav-mobile-avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.dj_name} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div>
                <div className="nav-mobile-name">{profile?.dj_name || 'DJ'}</div>
                <div className="nav-mobile-email">{user.email}</div>
              </div>
            </div>
          )}

          <div className="nav-mobile-links">
            <Link to="/explore" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>Esplora</Link>
            <Link to="/how" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>Come funziona</Link>
            {user && (
              <>
                <Link to="/upload" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>Carica transizione</Link>
                <Link to={`/dj/${user.id}`} className="nav-mobile-link" onClick={() => setMobileOpen(false)}>Il mio profilo</Link>
                <Link to="/settings" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>Impostazioni</Link>
              </>
            )}
          </div>

          <div className="nav-mobile-bottom">
            {user ? (
              <button className="nav-mobile-logout" onClick={() => { setMobileOpen(false); signOut(); }}>
                Esci
              </button>
            ) : (
              <>
            <Link to="/login" className="nav-mobile-login" onClick={() => setMobileOpen(false)}>Accedi</Link>
            <Link to="/signup" className="nav-mobile-signup" onClick={() => setMobileOpen(false)}>Registrati</Link>
                          </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
