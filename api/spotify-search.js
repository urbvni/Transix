// Vercel Serverless Function: /api/spotify-search
// Proxy verso Spotify Search API. Nasconde Client Secret al frontend.
// Token cached in memoria per ridurre chiamate a Spotify /token.

let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  // Se il token è ancora valido (con margine 60s), riusalo
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('Spotify token request failed');
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const token = await getSpotifyToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q.trim())}&type=track&limit=8&market=IT`;
    const spotifyRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!spotifyRes.ok) {
      const status = spotifyRes.status;
      if (status === 429) return res.status(429).json({ error: 'Spotify rate limit', results: [] });
      return res.status(status).json({ error: 'Spotify error', results: [] });
    }

    const data = await spotifyRes.json();
    // Formato ridotto per il frontend
    const results = (data.tracks?.items || []).map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
      album: t.album?.name,
      cover: t.album?.images?.[t.album.images.length - 1]?.url || null,
    }));

    // Cache header: 1 ora sul CDN Vercel, per query ripetute
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Spotify search error:', err);
    return res.status(500).json({ error: 'Search failed', results: [] });
  }
}
