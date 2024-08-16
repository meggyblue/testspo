const clientId = '4b07f14f30404c0fa549b29329d911be'; // Replace with your Spotify Client ID
const redirectUri = 'http://localhost:5500/';   // Replace with your redirect URI
let accessToken = '';

document.getElementById('loginButton').addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public playlist-modify-private`;
    window.location = authUrl;
});

window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        accessToken = params.get('access_token');
        if (accessToken) {
            document.getElementById('loginButton').style.display = 'none';
            document.getElementById('copyPlaylistButton').style.display = 'block';
        }
    }
});

document.getElementById('copyPlaylistButton').addEventListener('click', async () => {
    const playlistUrl = document.getElementById('playlistUrl').value.trim();
    if (!playlistUrl) {
        alert('Please enter a playlist URL');
        return;
    }

    const playlistId = getPlaylistIdFromUrl(playlistUrl);
    if (!playlistId) {
        alert('Invalid playlist URL');
        return;
    }

    const userProfile = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    }).then(response => response.json());

    const userId = userProfile.id;

    const playlistDetails = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    }).then(response => response.json());

    const newPlaylist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: playlistDetails.name + ' (Copy)',
            description: 'A copy of ' + playlistDetails.name,
            public: false
        })
    }).then(response => response.json());

    const trackUris = playlistDetails.tracks.items.map(item => item.track.uri);

    await fetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
    });

    document.getElementById('status').innerText = `Playlist copied successfully! Check your Spotify account.`;
});

function getPlaylistIdFromUrl(url) {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}
