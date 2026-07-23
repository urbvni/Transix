import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import './Comments.css';

export default function Comments({ transitionId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || !transitionId) return;
    fetchComments();
  }, [transitionId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select(`
        id, content, created_at, user_id,
        profiles ( id, dj_name, avatar_url )
      `)
      .eq('transition_id', transitionId)
      .order('created_at', { ascending: false });
    if (data) setComments(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const { data, error } = await supabase
      .from('comments')
      .insert({ transition_id: transitionId, user_id: user.id, content: text.trim() })
      .select(`id, content, created_at, user_id, profiles ( id, dj_name, avatar_url )`)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setComments((c) => [data, ...c]);
      setText('');
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId) {
    if (!confirm('Eliminare questo commento?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments((c) => c.filter((x) => x.id !== commentId));
    }
  }

  function timeAgo(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'ora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}g fa`;
    return d.toLocaleDateString('it-IT');
  }

  return (
    <section className="comments">
      <h2 className="comments-title">
        Commenti <span className="comments-count mono">{comments.length}</span>
      </h2>

      {/* Form nuovo commento */}
      {user ? (
        <form onSubmit={handleSubmit} className="comments-form">
          <div className="comments-form-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              <span>{profile?.dj_name?.[0]?.toUpperCase() || 'D'}</span>
            )}
          </div>
          <div className="comments-form-body">
            <textarea
              placeholder="Scrivi un commento..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={2}
              disabled={submitting}
            />
            <div className="comments-form-actions">
              <span className="mono comments-char">{text.length}/500</span>
              <button type="submit" disabled={!text.trim() || submitting} className="comments-submit">
                {submitting ? 'Invio...' : 'Pubblica'}
              </button>
            </div>
            {error && <div className="comments-error">{error}</div>}
          </div>
        </form>
      ) : (
        <div className="comments-login">
          <Link to="/login">Accedi</Link> per lasciare un commento.
        </div>
      )}

      {/* Lista commenti */}
      {loading ? (
        <div className="comments-empty">Caricamento...</div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">Nessun commento ancora. Sii il primo.</div>
      ) : (
        <ul className="comments-list">
          {comments.map((c) => {
            const initial = c.profiles?.dj_name?.[0]?.toUpperCase() || 'D';
            const isMine = user?.id === c.user_id;
            return (
              <li key={c.id} className="comments-item">
                <Link to={`/dj/${c.profiles?.id}`} className="comments-avatar">
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt="" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </Link>
                <div className="comments-body">
                  <div className="comments-head">
                    <Link to={`/dj/${c.profiles?.id}`} className="comments-name">
                      {c.profiles?.dj_name || 'DJ'}
                    </Link>
                    <span className="mono comments-time">{timeAgo(c.created_at)}</span>
                    {isMine && (
                      <button className="comments-delete" onClick={() => handleDelete(c.id)}>
                        Elimina
                      </button>
                    )}
                  </div>
                  <p className="comments-content">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
