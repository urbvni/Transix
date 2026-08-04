import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">transix</Link>
          <p className="footer-payoff">Non il set. La transizione.</p>
        </div>

        <nav className="footer-links">
          <Link to="/explore">Esplora</Link>
          <Link to="/how">Come funziona</Link>
        </nav>

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
