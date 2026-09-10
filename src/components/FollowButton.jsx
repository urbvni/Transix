import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './FollowButton.css';

/**
 * Bottone Segui/Segui già/Non seguire più.
 * Non compare se stai guardando il tuo profilo.
 * Al click alterna. Callback opzionale onChange(bool) per aggiornare counter parent.
 */
export default function FollowButton({ targetUserId, onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !supabase || !targetUserId) { setLoaded(true); return; }
    let ignore = false;
    supabase.from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (ignore) return;
        // Non sovrascrivere lo stato se stiamo mostrando un update ottimistico in corso
        if (!busy) {
          setFollowing(!!data);
        }
        setLoaded(true);
      });
    return () => { ignore = true; };
  }, [user, targetUserId]);

  async function toggle() {
    if (!user) { navigate('/login'); return; }
    if (busy || !supabase) return;

    setBusy(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    onChange?.(!wasFollowing);

    if (wasFollowing) {
      const { error } = await supabase.from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      if (error) { setFollowing(true); onChange?.(true); }
    } else {
      const { error } = await supabase.from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) { setFollowing(false); onChange?.(false); }
    }
    setBusy(false);
  }

  // Non mostrare nulla se è il tuo profilo o auth non ancora caricato
  if (!user || user.id === targetUserId) return null;
  if (!loaded) return <div className="follow-btn follow-btn-skeleton" />;

  return (
    <button
      className={`follow-btn ${following ? 'follow-btn-following' : ''}`}
      onClick={toggle}
      disabled={busy}
    >
      {following ? (
        <>
          <span className="follow-label-default">Segui già</span>
          <span className="follow-label-hover">Non seguire più</span>
        </>
      ) : (
        <span>Segui</span>
      )}
    </button>
  );
}
