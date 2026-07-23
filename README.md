# Transix

Libreria di transizioni tra due tracce, per chi studia il mixing armonico.

**Motto:** _Non il set. Il cambio._

---

## Come far partire il progetto in locale

```bash
# 1) installa le dipendenze
npm install

# 2) avvia il dev server (apre da solo il browser su http://localhost:5173)
npm run dev
```

Se vuoi la build di produzione:

```bash
npm run build     # genera la cartella /dist
npm run preview   # serve la build per verificarla in locale
```

---

## Configurazione Supabase (opzionale in questa fase)

Il progetto funziona senza Supabase: la Home usa dati mock finché non
colleghi il backend vero.

Quando sarai pronto a collegarlo:

1. Crea un progetto gratuito su [supabase.com](https://supabase.com)
2. Vai in **Project Settings → API** e copia:
   - **Project URL**
   - **anon public key**
3. Duplica il file `.env.example` rinominandolo in `.env` (nella root del progetto)
4. Incolla i valori copiati nelle due variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
5. Riavvia `npm run dev`

Le variabili con prefisso `VITE_` sono esposte al frontend: normale per la
`anon key`, che è progettata per essere pubblica (la sicurezza si gestisce
lato Postgres con Row Level Security).

---

## Struttura cartelle

```
transix/
├── index.html              # entry HTML
├── package.json
├── vite.config.js
├── .env.example            # template variabili Supabase
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx            # entry React
    ├── App.jsx             # routing principale
    ├── components/         # componenti riutilizzabili
    │   ├── Navbar.jsx
    │   ├── Vinyl.jsx       # vinile 3D CSS
    │   ├── SearchBar.jsx   # ricerca + filtri
    │   └── TransitionCard.jsx
    ├── pages/              # una cartella per ogni rotta
    │   ├── Home.jsx
    │   └── Placeholder.jsx
    ├── lib/                # helper e client
    │   ├── supabase.js
    │   ├── camelot.js      # 24 key Camelot + BPM steps
    │   └── mockData.js     # dati fittizi per sviluppo
    └── styles/
        └── global.css      # reset + variabili palette/font
```

Convenzione: ogni componente ha il suo `.css` accanto al `.jsx` con lo stesso
nome — così scoping visivo e maintenance restano semplici, senza aver bisogno
di framework CSS.

---

## Stack

- **Vite + React 18** — build tool moderno, dev server istantaneo
- **React Router 6** — routing lato client
- **Supabase JS client** — quando collegheremo il backend
- **CSS puro con variabili** — palette e font centralizzati in `global.css`

---

## Prossimi passi

- Pagina di upload transizione (form completo, validazione durata 30s)
- Pagina singola transizione (player, waveform)
- Auth (registrazione/login DJ)
- Filtro per compatibilità armonica automatica (fase 2)
