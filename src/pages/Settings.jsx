import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './Settings.css';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_MB = 2;

export default function Settings() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [djName, setDjName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

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
    if (!file.type.startsWith('image/')) { setError("Il file deve essere un'immagine."); return; }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) { setError(`L'immagine è troppo grande (max ${MAX_AVATAR_MB}MB).`); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setMessage(null); setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(fileName, avatarFile, { upsert: false });
        if (uploadError) throw new Error(`Upload avatar fallito: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(fileName);
        newAvatarUrl = urlData.publicUrl;
      }
      const { error: updateError } = await supabase.from('profiles')
        .update({ dj_name: djName, bio: bio || null, avatar_url: newAvatarUrl || null })
        .eq('id', user.id);
      if (updateError) throw new Error(`Salvataggio fallito: ${updateError.message}`);

      setMessage('Profilo aggiornato.');
      setAvatarFile(null); setAvatarPreview(null); setAvatarUrl(newAvatarUrl);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err.message); setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmDelete !== 'ELIMINA') {
      alert('Devi scrivere ELIMINA per confermare.');
      return;
    }
    if (!confirm('Sei davvero sicuro? Tutti i tuoi dati (profilo, transizioni, like, commenti, collezioni) saranno cancellati definitivamente.')) return;

    setDeleting(true);

    // Elimina il record profilo (cascata elimina transizioni, likes, comments, collezioni)
    // Poi facciamo signOut. NB: l'utente in auth.users resta (Supabase non permette al client
    // di eliminarlo da solo per sicurezza), ma tutti i dati collegati sono cancellati.
    // Se serve rimuovere anche auth.users, servirebbe una Edge Function con service key.
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) {
      alert('Errore: ' + error.message);
      setDeleting(false);
      return;
    }

    await signOut();
    navigate('/');
    alert('Account eliminato.');
  }

  if (authLoading || !profile) return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;

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
          <section className="settings-section">
            <h2>Immagine profilo</h2>
            <div className="settings-avatar-row">
              <div className="settings-avatar">
                {displayedAvatar ? <img src={displayedAvatar} alt="" /> : <span className="settings-avatar-fallback">{initial}</span>}
              </div>
              <div className="settings-avatar-actions">
                <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatar-input" style={{ display: 'none' }} disabled={saving} />
                <label htmlFor="avatar-input" className="settings-file-btn">
                  {avatarFile ? avatarFile.name : 'Scegli immagine'}
                </label>
                <small>PNG o JPG, max {MAX_AVATAR_MB}MB. Dimensioni consigliate 400×400px.</small>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Informazioni</h2>
            <div className="settings-grid">
              <label className="settings-field settings-field-full">
                <span>Nome d'arte</span>
                <input type="text" value={djName} onChange={(e) => setDjName(e.target.value)} required minLength={2} maxLength={30} disabled={saving} />
              </label>
              <label className="settings-field settings-field-full">
                <span>Bio</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" maxLength={500} placeholder="Chi sei, dove suoni, che generi mixi..." disabled={saving} />
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

        {/* Danger zone */}
        <section className="settings-danger">
          <h2>Elimina account</h2>
          <p>Questa azione eliminerà definitivamente il tuo profilo, tutte le tue transizioni, i like, i commenti e le collezioni. Non è reversibile.</p>
          <div className="settings-danger-form">
            <label className="settings-field">
              <span>Scrivi <strong>ELIMINA</strong> per confermare</span>
              <input type="text" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="ELIMINA" disabled={deleting} />
            </label>
            <button
              type="button"
              className="settings-delete-btn"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmDelete !== 'ELIMINA'}
            >
              {deleting ? 'Eliminazione...' : 'Elimina definitivamente'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
