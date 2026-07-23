import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { attachCounts } from '../lib/counts';
import TransitionCard from '../components/TransitionCard';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [likedTransitions, setLikedTransitions] = useState([]);
  const [collections, setCollections] = useState([]);
  const [openCollection, setOpenCollection] = useState(null); // id collezione espansa
  const [collectionItems, setCollectionItems] = useState({}); // { collectionId: [transitions] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('uploads');

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (!supabase || !id) return;
    fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);

    // Profilo
    const { data: profileData, error: profileError } = await supabase
      .from('profiles').select('*').eq('id', id).single();
    if (profileError || !profileData) {
      setError('Profilo non trovato.'); setLoading(false); return;
    }
    setProfile(profileData);

    // Uploads
    const { data: txData } = await supabase
      .from('transitions')
      .select(`id, title, key_a, key_b, bpm_a_original, bpm_b_original, bpm_sync, track_a_title, track_a_artist, track_b_title, track_b_artist, created_at, genres ( name )`)
      .eq('dj_id', id).order('created_at', { ascending: false });

    if (txData) {
      const normalized = txData.map((t) => normalize(t, profileData.dj_name));
      setUploads(await attachCounts(normalized));
    }

    // Like pubblici (transizioni a cui l'utente ha messo like)
    const { data: likesData } = await supabase
      .from('likes')
      .select(`
        transition_id,
        transitions (
          id, title, key_a, key_b,
          bpm_a_original, bpm_b_original, bpm_sync,
          track_a_title, track_a_artist, track_b_title, track_b_artist,
          created_at,
          profiles ( dj_name ),
          genres ( name )
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (likesData) {
      const normalized = likesData
        .filter((l) => l.transitions) // esclude like a transizioni cancellate
        .map((l) => normalize(l.transitions, l.transitions.profiles?.dj_name));
      setLikedTransitions(await attachCounts(normalized));
    }

    // Collezioni (solo se sto guardando il MIO profilo)
    if (isOwnProfile) {
      const { data: cols } = await supabase
        .from('collections')
        .select('id, name, is_default, created_at')
        .eq('user_id', id)
        .order('is_default', { ascending: false })
        .order('created_at');
      setCollections(cols || []);
    }

    setLoading(false);
  }

  function normalize(t, djName) {
    return {
      id: t.id,
      title: t.title,
      dj_name: djName || 'DJ',
      track_a: { title: t.track_a_title, artist: t.track_a_artist },
      track_b: { title: t.track_b_title, artist: t.track_b_artist },
      key_a: t.key_a, key_b: t.key_b,
      bpm_a_original: t.bpm_a_original,
      bpm_b_original: t.bpm_b_original,
      bpm_sync: t.bpm_sync,
      genre: t.genres?.name || '',
    };
  }

  async function toggleCollection(collectionId) {
    if (openCollection === collectionId) {
      setOpenCollection(null);
      return;
    }
    setOpenCollection(collectionId);
    if (collectionItems[collectionId]) return; // già caricata

    const { data } = await supabase
      .from('collection_transitions')
      .select(`
        transition_id,
        transitions (
          id, title, key_a, key_b,
          bpm_a_original, bpm_b_original, bpm_sync,
          track_a_title, track_a_artist, track_b_title, track_b_artist,
          created_at,
          profiles ( dj_name ),
          genres ( name )
        )
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (data) {
      const normalized = data
        .filter((r) => r.transitions)
        .map((r) => normalize(r.transitions, r.transitions.profiles?.dj_name));
      const withCounts = await attachCounts(normalized);
      setCollectionItems((prev) => ({ ...prev, [collectionId]: withCounts }));
    }
  }

  async function deleteCollection(collectionId, isDefault) {
    if (isDefault) { alert('Non puoi eliminare la collezione di default.'); return; }
    if (!confirm('Eliminare questa collezione?')) return;
    const { error } = await supabase.from('collections').delete().eq('id', collectionId);
    if (!error) {
      setCollections((c) => c.filter((x) => x.id !== collectionId));
      if (openCollection === collectionId) setOpenCollection(null);
    }
  }

  if (loading) return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;
  if (error || !profile) {
    return (
      <div className="container" style={{ padding: 80, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>Profilo non trovato</h1>
        <Link to="/" style={{ color: 'var(--accent-a-text)' }}>Torna alla home</Link>
      </div>
    );
  }

  const initial = profile.dj_name?.[0]?.toUpperCase() || 'D';

  return (
    <div className="profile-page">
      <div className="container">
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
              <span>{uploads.length} {uploads.length === 1 ? 'transizione' : 'transizioni'}</span>
              <span>{likedTransitions.length} like</span>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/settings" className="profile-edit">Modifica profilo</Link>
          )}
        </header>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'uploads' ? 'profile-tab-active' : ''}`} onClick={() => setTab('uploads')}>
            Transizioni <span className="mono">{uploads.length}</span>
          </button>
          <button className={`profile-tab ${tab === 'likes' ? 'profile-tab-active' : ''}`} onClick={() => setTab('likes')}>
            Like <span className="mono">{likedTransitions.length}</span>
          </button>
          {isOwnProfile && (
            <button className={`profile-tab ${tab === 'collections' ? 'profile-tab-active' : ''}`} onClick={() => setTab('collections')}>
              Collezioni <span className="mono">{collections.length}</span>
            </button>
          )}
        </div>

        {/* Contenuto tab */}
        {tab === 'uploads' && (
          <section>
            {uploads.length > 0 ? (
              <div className="profile-grid">
                {uploads.map((t) => <TransitionCard key={t.id} transition={t} />)}
              </div>
            ) : (
              <div className="profile-empty">
                {isOwnProfile
                  ? <>Non hai ancora caricato transizioni. <Link to="/upload" className="profile-empty-link">Carica la prima</Link>.</>
                  : 'Nessuna transizione caricata da questo DJ.'}
              </div>
            )}
          </section>
        )}

        {tab === 'likes' && (
          <section>
            {likedTransitions.length > 0 ? (
              <div className="profile-grid">
                {likedTransitions.map((t) => <TransitionCard key={t.id} transition={t} />)}
              </div>
            ) : (
              <div className="profile-empty">
                {isOwnProfile ? 'Non hai ancora messo like a nessuna transizione.' : 'Nessun like da questo DJ.'}
              </div>
            )}
          </section>
        )}

        {tab === 'collections' && isOwnProfile && (
          <section className="profile-collections">
            {collections.length === 0 ? (
              <div className="profile-empty">Nessuna collezione ancora.</div>
            ) : collections.map((c) => (
              <div key={c.id} className={`coll ${openCollection === c.id ? 'coll-open' : ''}`}>
                <button className="coll-head" onClick={() => toggleCollection(c.id)}>
                  <svg className="coll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                  <span className="coll-name">{c.name}</span>
                  {c.is_default && <span className="coll-default mono">default</span>}
                  {!c.is_default && (
                    <span
                      className="coll-delete"
                      onClick={(e) => { e.stopPropagation(); deleteCollection(c.id, c.is_default); }}
                    >
                      Elimina
                    </span>
                  )}
                </button>
                {openCollection === c.id && (
                  <div className="coll-body">
                    {collectionItems[c.id] === undefined ? (
                      <div className="profile-empty">Caricamento...</div>
                    ) : collectionItems[c.id].length === 0 ? (
                      <div className="profile-empty">Nessuna transizione in questa collezione.</div>
                    ) : (
                      <div className="profile-grid">
                        {collectionItems[c.id].map((t) => <TransitionCard key={t.id} transition={t} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
