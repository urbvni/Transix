import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FollowButton from '../components/FollowButton';
import './FollowList.css';

/**
 * Pagina: elenco follower o following di un DJ.
 * Route: /dj/:id/followers  |  /dj/:id/following
 */
export default function FollowList({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !id) return;
    fetchAll();
  }, [id, mode]);

  async function fetchAll() {
    setLoading(true);

    // Profilo target
    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(p);

    // Chi lo segue / chi segue
    let query;
    if (mode === 'followers') {
      // I follower: dove following_id = id, prendi follower_id → profilo
      query = supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey ( id, dj_name, bio, avatar_url )')
        .eq('following_id', id);
    } else {
      // I seguiti: dove follower_id = id, prendi following_id → profilo
      query = supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey ( id, dj_name, bio, avatar_url )')
        .eq('follower_id', id);
    }

    const { data } = await query;
    if (data) {
      const normalized = data
        .map((r) => r.profiles)
        .filter(Boolean);
      setUsers(normalized);
    }
    setLoading(false);
  }

  if (loading) return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Caricamento...</div>;
  if (!profile) return <div className="container" style={{ padding: 80, textAlign: 'center' }}>Profilo non trovato</div>;

  const title = mode === 'followers' ? 'Follower' : 'Seguiti';

  return (
    <div className="fl-page">
      <div className="container">
        <button className="fl-back" onClick={() => navigate(`/dj/${id}`)}>
          ← Torna al profilo di {profile.dj_name}
        </button>

        <header className="fl-header">
          <h1>{title} di {profile.dj_name}</h1>
          <span className="mono fl-count">{users.length}</span>
        </header>

        {users.length === 0 ? (
          <div className="fl-empty">
            {mode === 'followers' ? 'Nessun follower ancora.' : 'Non segue ancora nessuno.'}
          </div>
        ) : (
          <ul className="fl-list">
            {users.map((u) => {
              const initial = u.dj_name?.[0]?.toUpperCase() || 'D';
              return (
                <li key={u.id} className="fl-item">
                  <Link to={`/dj/${u.id}`} className="fl-avatar">
                    {u.avatar_url ? <img src={u.avatar_url} alt={u.dj_name} /> : <span>{initial}</span>}
                  </Link>
                  <div className="fl-info">
                    <Link to={`/dj/${u.id}`} className="fl-name">{u.dj_name}</Link>
                    {u.bio && <p className="fl-bio">{u.bio}</p>}
                  </div>
                  <div className="fl-action">
                    <FollowButton targetUserId={u.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
