export default function Placeholder({ title }) {
  return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 40, marginBottom: 16 }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-dim)' }}>
        Questa pagina sarà costruita nei prossimi step del progetto.
      </p>
    </div>
  );
}
