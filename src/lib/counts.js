import { supabase } from './supabase';

/**
 * Data una lista di transizioni con id, aggiunge likes_count e comments_count.
 * Fa 2 query aggregate. Batch efficiente per liste (Home/Explore/Profile).
 */
export async function attachCounts(transitions) {
  if (!supabase || !transitions || transitions.length === 0) return transitions;
  const ids = transitions.map((t) => t.id);

  // Recupera tutti i like per queste transizioni e conta in JS (semplice, veloce per liste piccole)
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from('likes').select('transition_id').in('transition_id', ids),
    supabase.from('comments').select('transition_id').in('transition_id', ids),
  ]);

  const likeMap = {};
  (likes || []).forEach((l) => { likeMap[l.transition_id] = (likeMap[l.transition_id] || 0) + 1; });
  const commentMap = {};
  (comments || []).forEach((c) => { commentMap[c.transition_id] = (commentMap[c.transition_id] || 0) + 1; });

  return transitions.map((t) => ({
    ...t,
    likes_count: likeMap[t.id] || 0,
    comments_count: commentMap[t.id] || 0,
  }));
}
