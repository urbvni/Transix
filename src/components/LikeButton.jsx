import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './LikeButton.css';

export default function LikeButton({ transitionId, initialLiked = false, initialCount = 0, size = 'md', showCount = true }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) { navigate('/login'); return; }
    if (busy || !supabase) return;

    setBusy(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => c + (newLiked ? 1 : -1));

    if (newLiked) {
      const { error } = await supabase.from('likes').insert({ transition_id: transitionId, user_id: user.id });
      if (error) { setLiked(false); setCount((c) => c - 1); }
    } else {
      const { error } = await supabase.from('likes').delete().eq('transition_id', transitionId).eq('user_id', user.id);
      if (error) { setLiked(true); setCount((c) => c + 1); }
    }
    setBusy(false);
  }

  return (
    <button
      className={`like-btn like-btn-${size} ${liked ? 'like-btn-active' : ''}`}
      onClick={handleClick}
      disabled={busy}
      aria-label={liked ? 'Rimuovi like' : 'Metti like'}
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {showCount && <span className="like-count mono">{count}</span>}
    </button>
  );
}
