export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  // Exchange refresh token for access token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const { access_token } = await tokenRes.json();

  // Try currently playing first
  const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (nowRes.status === 200) {
    const data = await nowRes.json();
    if (data?.item) {
      return res.json({
        playing: true,
        title: data.item.name,
        artist: data.item.artists.map(a => a.name).join(', '),
        url: data.item.external_urls.spotify,
      });
    }
  }

  // Fall back to recently played
  const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const recent = await recentRes.json();
  const track = recent?.items?.[0]?.track;

  if (!track) return res.json({ title: null });

  return res.json({
    playing: false,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    url: track.external_urls.spotify,
  });
}
