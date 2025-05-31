const accessToken = '7e167a0ee1ef4863b4f3fd594d73b7bc'; // Replace with your token

async function getProfile() {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  if (response.ok) {
    const data = await response.json();
    document.getElementById('currently-playing').textContent =
      `Logged in as: ${data.display_name}`;
  } else {
    document.getElementById('currently-playing').textContent =
      'Could not fetch profile. Check your access token.';
  }
}

async function getCurrentlyPlaying() {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  if (response.ok && response.status === 200) {
    const data = await response.json();
    if (data && data.item) {
      const track = data.item;
      document.getElementById('currently-playing').textContent =
        `Now Playing: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`;
    } else {
      document.getElementById('currently-playing').textContent = 'Nothing is currently playing.';
    }
  } else {
    document.getElementById('currently-playing').textContent = 'No track currently playing or not authorized.';
  }
}

// Example: show profile, then currently playing
getProfile();
getCurrentlyPlaying();