import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import TransitionCard from '../components/TransitionCard';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || !id) return;

    async function fetchData() {
      setLoading(true);

      // Profilo
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError || !profileData) {
        setError('Profilo non trovato.');
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Transizioni di questo DJ
      const { data: txData } = await supabase
        .from('transitions')
        .select(`
          id, title, key_a, key_b,
          bpm_a_original, bpm_b_original, bpm_sync,
          track_a_title, track_a_artist, track_b_title, track_b_artist,
          created_at,
          genres ( name )
        `)
        .eq('dj_id', id)
        .order('created_at', { ascending: false });

      if (txData) {
        const normalized = txData.map((t) => ({
          id: t.id,
          title: t.title,
          dj_name: profileData.dj_name,
          track_a: { title: t.track_a_title, artist: t.track_a_artist },
          track_b: { title: t.track_b_title, artist: t.track_b_artist },
          key_a: t.key_a,
          key_b: t.key_b,
          bpm_a_original: t.bpm_a_original,
          bpm_b_original: t.bpm_b_original,
          bpm_sync: t.bpm_sync,
          genre: t.genres?.name || '',
        }));
        setTransitions(normalized);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const isOwnProfile = user?.id === id;

  if (loading) {
    return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;
  }
  if (error || !profile) {
    return (
      <div className="container" style={{ padding: 80, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>Profilo non trovato</h1>
        <Link to="/" style={{ color: 'var(--accent-a-text)' }}>Torna alla home</Link>
      </div>
    );
  }

  // Inizialen del nome per fallback avatar
  const initial = profile.dj_name?.[0]?.toUpperCase() || 'D';

  return (
    <div className="profile-page">
      <div className="container">
        {/* Header profilo */}
        <header className="profile-header">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.dj_name} />
            ) : (
              <span className="profile-avatar-fallback">{initial}</span>
            )}
          </div>

          <div className="profile-info">
            <span className="profile-eyebrow mono">DJ</span>
            <h1 className="profile-name">{profile.dj_name}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats mono">
              <span>{transitions.length} {transitions.length === 1 ? 'transizione' : 'transizioni'}</span>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/settings" className="profile-edit">Modifica profilo</Link>
          )}
        </header>

        {/* Transizioni */}
        <section className="profile-section">
          <h2 className="profile-section-title">Transizioni</h2>

          {transitions.length > 0 ? (
            <div className="profile-grid">
              {transitions.map((t) => (
                <TransitionCard key={t.id} transition={t} />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              {isOwnProfile
                ? <>Non hai ancora caricato transizioni. <Link to="/upload" className="profile-empty-link">Carica la prima</Link>.</>
                : 'Nessuna transizione caricata da questo DJ.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
