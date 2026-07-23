import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './Settings.css';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_MB = 2;

export default function Settings() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [djName, setDjName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Redirect se non loggato
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  // Popola i campi con i dati attuali del profilo
  useEffect(() => {
    if (profile) {
      setDjName(profile.dj_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  function handleAvatarChange(e) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Il file deve essere un\'immagine.');
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError(`L'immagine è troppo grande (max ${MAX_AVATAR_MB}MB).`);
      return;
    }

    setAvatarFile(file);
    // Preview locale
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      let newAvatarUrl = avatarUrl;

      // 1. Se c'è un nuovo avatar, caricalo su Storage
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(fileName, avatarFile, { upsert: false });

        if (uploadError) throw new Error(`Upload avatar fallito: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(fileName);
        newAvatarUrl = urlData.publicUrl;
      }

      // 2. Aggiorna il record profilo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          dj_name: djName,
          bio: bio || null,
          avatar_url: newAvatarUrl || null,
        })
        .eq('id', user.id);

      if (updateError) throw new Error(`Salvataggio fallito: ${updateError.message}`);

      setMessage('Profilo aggiornato.');
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarUrl(newAvatarUrl);

      // Ricarica la pagina dopo un momento così AuthContext riprende il profilo aggiornato
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (authLoading || !profile) {
    return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;
  }

  const initial = djName?.[0]?.toUpperCase() || 'D';
  const displayedAvatar = avatarPreview || avatarUrl;

  return (
    <div className="settings-page">
      <div className="container">
        <header className="settings-header">
          <h1>Impostazioni profilo</h1>
          <Link to={`/dj/${user.id}`} className="settings-view-link">Vedi profilo pubblico</Link>
        </header>

        <form onSubmit={handleSubmit} className="settings-form">
          {/* Avatar */}
          <section className="settings-section">
            <h2>Immagine profilo</h2>
            <div className="settings-avatar-row">
              <div className="settings-avatar">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt="" />
                ) : (
                  <span className="settings-avatar-fallback">{initial}</span>
                )}
              </div>
              <div className="settings-avatar-actions">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  id="avatar-input"
                  style={{ display: 'none' }}
                  disabled={saving}
                />
                <label htmlFor="avatar-input" className="settings-file-btn">
                  {avatarFile ? avatarFile.name : 'Scegli immagine'}
                </label>
                <small>PNG o JPG, max {MAX_AVATAR_MB}MB. Le dimensioni consigliate sono 400×400px.</small>
              </div>
            </div>
          </section>

          {/* Nome e bio */}
          <section className="settings-section">
            <h2>Informazioni</h2>
            <div className="settings-grid">
              <label className="settings-field settings-field-full">
                <span>Nome d'arte</span>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={30}
                  disabled={saving}
                />
              </label>
              <label className="settings-field settings-field-full">
                <span>Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="4"
                  maxLength={500}
                  placeholder="Chi sei, dove suoni, che generi mixi..."
                  disabled={saving}
                />
                <small>{bio.length}/500</small>
              </label>
            </div>
          </section>

          {error && <div className="settings-error">{error}</div>}
          {message && <div className="settings-success">{message}</div>}

          <button type="submit" className="settings-submit" disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>
    </div>
  );
}
