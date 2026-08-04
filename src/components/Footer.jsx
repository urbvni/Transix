import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import './Footer.css';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">transix</Link>
            <p className="footer-payoff">
              Non il set.<br />
              <span className="footer-payoff-accent">La transizione.</span>
            </p>
          </div>

          <nav className="footer-links">
            <Link to="/explore">Esplora</Link>
            <Link to="/how">Come funziona</Link>
            {user ? (
              <>
                <Link to="/upload">Carica</Link>
                <Link to={`/dj/${user.id}`}>Profilo</Link>
              </>
            ) : (
              <>
                <Link to="/login">Accedi</Link>
                <Link to="/signup">Registrati</Link>
              </>
            )}
          </nav>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy mono">© {new Date().getFullYear()} Transix</span>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
