import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { CAMELOT_KEYS } from '../lib/camelot';
import { readAudioDuration } from '../lib/audio';
import TrackAutocomplete from '../components/TrackAutocomplete';
import './Upload.css';

const MAX_DURATION_SECONDS = 90;
const STORAGE_BUCKET = 'transitions-audio';

export default function Upload() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackATitle, setTrackATitle] = useState('');
  const [trackAArtist, setTrackAArtist] = useState('');
  const [keyA, setKeyA] = useState('');
  const [bpmA, setBpmA] = useState('');
  const [trackBTitle, setTrackBTitle] = useState('');
  const [trackBArtist, setTrackBArtist] = useState('');
  const [keyB, setKeyB] = useState('');
  const [bpmB, setBpmB] = useState('');
  const [bpmSync, setBpmSync] = useState('');
  const [genreId, setGenreId] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

  const [genres, setGenres] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.from('genres').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setGenres(data);
    });
  }, []);

  async function handleFileChange(e) {
    setError(null);
    setAudioDuration(null);
    const file = e.target.files?.[0];
    if (!file) { setAudioFile(null); return; }
    if (!file.type.startsWith('audio/')) {
      setError('Il file deve essere un audio (mp3, wav, m4a...).');
      setAudioFile(null); return;
    }
    try {
      const duration = await readAudioDuration(file);
      if (duration > MAX_DURATION_SECONDS) {
        setError(`Il file dura ${duration.toFixed(1)}s. Il massimo consentito è ${MAX_DURATION_SECONDS}s.`);
        setAudioFile(null); return;
      }
      setAudioFile(file);
      setAudioDuration(Math.round(duration));
    } catch (err) {
      setError(err.message);
      setAudioFile(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!audioFile) { setError('Carica un file audio.'); return; }
    if (!supabase) { setError('Supabase non configurato.'); return; }

    setUploading(true);
    try {
      setProgress('Caricamento file audio...');
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, audioFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(`Upload fallito: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      setProgress('Salvataggio metadati...');
      const { data: inserted, error: insertError } = await supabase
        .from('transitions')
        .insert({
          dj_id: user.id,
          title, description: description || null,
          audio_url: audioUrl,
          audio_duration_seconds: audioDuration,
          track_a_title: trackATitle, track_a_artist: trackAArtist,
          key_a: keyA, bpm_a_original: parseInt(bpmA, 10),
          track_b_title: trackBTitle, track_b_artist: trackBArtist,
          key_b: keyB, bpm_b_original: parseInt(bpmB, 10),
          bpm_sync: parseInt(bpmSync, 10),
          genre_id: genreId ? parseInt(genreId, 10) : null,
        })
        .select().single();

      if (insertError) throw new Error(`Salvataggio fallito: ${insertError.message}`);

      setProgress('Fatto! Reindirizzamento...');
      setTimeout(() => navigate(`/t/${inserted.id}`), 800);
    } catch (err) {
      setError(err.message);
      setUploading(false);
      setProgress('');
    }
  }

  if (authLoading) return <div className="container" style={{ padding: 80 }}>Caricamento...</div>;
  if (!user) return null;

  return (
    <div className="upload-page">
      <div className="container">
        <header className="upload-header">
          <h1>Carica una transizione</h1>
          <p>Un cambio tecnico tra due tracce, massimo {MAX_DURATION_SECONDS} secondi.</p>
        </header>

        <form onSubmit={handleSubmit} className="upload-form">
          <section className="form-section">
            <h2>File audio</h2>
            <div className="file-input">
              <input type="file" accept="audio/*" onChange={handleFileChange} id="audio-input" disabled={uploading} />
              <label htmlFor="audio-input" className="file-label">
                {audioFile ? `${audioFile.name} — ${audioDuration}s` : 'Scegli file audio (max 90s)'}
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2>Info transizione</h2>
            <div className="form-grid">
              <label className="form-field form-field-full">
                <span>Titolo *</span>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Starsips VS One More Time" disabled={uploading} />
              </label>
              <label className="form-field form-field-full">
                <span>Descrizione</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Note tecniche..." disabled={uploading} />
              </label>
              <label className="form-field">
                <span>Genere</span>
                <select value={genreId} onChange={(e) => setGenreId(e.target.value)} disabled={uploading}>
                  <option value="">Seleziona...</option>
                  {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>BPM sync *</span>
                <input type="number" value={bpmSync} onChange={(e) => setBpmSync(e.target.value)} required min="60" max="200" placeholder="es. 124" disabled={uploading} />
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2><span className="track-label track-label-a">A</span> Traccia in uscita</h2>
            <div className="form-grid">
              <TrackAutocomplete
                titleValue={trackATitle}
                artistValue={trackAArtist}
                onChangeTitle={setTrackATitle}
                onChangeArtist={setTrackAArtist}
                onSelectPair={({ title, artist }) => { setTrackATitle(title); setTrackAArtist(artist); }}
                disabled={uploading}
              />
              <label className="form-field">
                <span>Key Camelot *</span>
                <select value={keyA} onChange={(e) => setKeyA(e.target.value)} required disabled={uploading}>
                  <option value="">Seleziona...</option>
                  {CAMELOT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>BPM originale *</span>
                <input type="number" value={bpmA} onChange={(e) => setBpmA(e.target.value)} required min="60" max="200" disabled={uploading} />
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2><span className="track-label track-label-b">B</span> Traccia in ingresso</h2>
            <div className="form-grid">
              <TrackAutocomplete
                titleValue={trackBTitle}
                artistValue={trackBArtist}
                onChangeTitle={setTrackBTitle}
                onChangeArtist={setTrackBArtist}
                onSelectPair={({ title, artist }) => { setTrackBTitle(title); setTrackBArtist(artist); }}
                disabled={uploading}
              />
              <label className="form-field">
                <span>Key Camelot *</span>
                <select value={keyB} onChange={(e) => setKeyB(e.target.value)} required disabled={uploading}>
                  <option value="">Seleziona...</option>
                  {CAMELOT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>BPM originale *</span>
                <input type="number" value={bpmB} onChange={(e) => setBpmB(e.target.value)} required min="60" max="200" disabled={uploading} />
              </label>
            </div>
          </section>

          {error && <div className="form-error">{error}</div>}
          {progress && <div className="form-progress">{progress}</div>}

          <button type="submit" className="form-submit" disabled={uploading}>
            {uploading ? 'Caricamento...' : 'Pubblica transizione'}
          </button>
        </form>
      </div>
    </div>
  );
}
