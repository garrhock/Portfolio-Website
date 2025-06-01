const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

const client_id = '7e167a0ee1ef4863b4f3fd594d73b7bc';
const client_secret = '58068859e28342eaa6bfeb891f1d4a22';
const refresh_token = 'AQBMvznxTfbJIQtifVwVQbzLwH5AyF2tNmCL8Ac6MyQvEuQCDBYruaPX9SxXR5hwWkh92NS4Sil6N6DM4JuO07Cnht8fT0bdfELZXvjh_5DDV_xqX9uIyOm0sUBg26F6T38';

// Base64 encode for authorization header
function base64Encode(str) {
  return btoa(str);
}

// Function to get access token using refresh token
async function getAccessToken(client_id, client_secret, refresh_token) {
  const basic = base64Encode(`${client_id}:${client_secret}`);

  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('refresh_token', refresh_token);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  return response.json();
}

// Function to fetch currently playing song
async function getNowPlaying() {
  try {
    const { access_token } = await getAccessToken(client_id, client_secret, refresh_token);

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (response.status === 204) {
      throw new Error('Currently Not Playing');
    }
    if (!response.ok) {
      throw new Error('Unable to Fetch Song');
    }

    const song = await response.json();

    const albumImageUrl = song.item.album.images[0].url;
    const artist = song.item.artists.map(a => a.name).join(', ');
    const isPlaying = song.is_playing;
    const songUrl = song.item.external_urls.spotify;
    const title = song.item.name;
    const timePlayed = song.progress_ms;
    const timeTotal = song.item.duration_ms;
    const artistUrl = song.item.album.artists[0].external_urls.spotify;

    return {
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
      timePlayed,
      timeTotal,
      artistUrl
    };
  } catch (error) {
    console.error('Error fetching currently playing song:', error);
    return error.message;
  }
}

function pad(num) {
  return num.toString().padStart(2, '0');
}

function blendWithGray([r, g, b], factor = 0.8) {
  // factor: 0 = full gray, 1 = original color
  return [
    Math.round(r * factor + 128 * (1 - factor)),
    Math.round(g * factor + 128 * (1 - factor)),
    Math.round(b * factor + 128 * (1 - factor))
  ];
}

// Helper to apply palette to card and body
function applyPaletteToCardAndBody(cardElement, primary, secondary) {
  const muddyPrimary = blendWithGray(primary, 0.78);
  const muddySecondary = blendWithGray(secondary, 0.8);

  cardElement.style.background = `linear-gradient(90deg, rgb(${muddySecondary.join(',')}), rgb(${muddyPrimary.join(',')}))`;

  const primaryStr = `rgb(${primary.join(',')})`;
  const secondaryStr = `rgb(${secondary.join(',')})`;

  cardElement.style.setProperty('--nowplaying-primary', primaryStr);
  cardElement.style.setProperty('--nowplaying-title', secondaryStr);
  cardElement.style.setProperty('--nowplaying-bright', secondaryStr);

  setBodyGradient(primary, secondary);
}

function setCardGradientFromImage(imgElement, cardElement) {
  const colorThief = new ColorThief();

  function setGradient() {
    const palette = colorThief.getPalette(imgElement, 2);
    if (palette && palette.length >= 2) {
      const [primary, secondary] = palette;
      applyPaletteToCardAndBody(cardElement, primary, secondary);
    }
  }

  if (imgElement.complete && imgElement.naturalHeight !== 0) {
    setGradient();
  } else {
    imgElement.addEventListener('load', setGradient, { once: true });
  }
}

function setBodyGradient(primary, secondary) {
  const body = document.body;
  if (primary && secondary) {
    body.style.setProperty(
      '--site-bg',
      `linear-gradient(135deg, rgb(${secondary.join(',')}), rgb(${primary.join(',')}), #111 90%)`
    );
  } else {
    body.style.setProperty('--site-bg', '#111');
  }
}

function updateUI(nowPlaying) {
  const albumImage = document.getElementById('albumImage');
  const titleEl = document.getElementById('nowPlayingTitle');
  const artistEl = document.getElementById('nowPlayingArtist');
  const progressBar = document.querySelector('.nowPlayingProgress');
  const timeStart = document.getElementById('nowPlayingTimeStart');
  const timeEnd = document.getElementById('nowPlayingTimeEnd');
  const cardElement = document.getElementById('nowPlayingCard');

  let secondsPlayed = 0, minutesPlayed = 0, secondsTotal = 0, minutesTotal = 0;
  let songUrl = null;

  // Hide the card until ready
  if (cardElement) cardElement.style.visibility = 'hidden';

  if (nowPlaying && typeof nowPlaying === 'object' && nowPlaying.title) {
    secondsPlayed = Math.floor(nowPlaying.timePlayed / 1000);
    minutesPlayed = Math.floor(secondsPlayed / 60);
    secondsPlayed = secondsPlayed % 60;

    secondsTotal = Math.floor(nowPlaying.timeTotal / 1000);
    minutesTotal = Math.floor(secondsTotal / 60);
    secondsTotal = secondsTotal % 60;

    const albumImageUrl = nowPlaying.albumImageUrl;
    songUrl = nowPlaying.songUrl;

    // Remove previous click listeners to avoid stacking
    albumImage.onclick = null;
    titleEl.onclick = null;

    // Only update UI after image loads
    albumImage.onload = function () {
      setCardGradientFromImage(albumImage, cardElement);

      titleEl.textContent = nowPlaying.title;
      artistEl.innerHTML = `<a href="${nowPlaying.artistUrl}" target="_blank" rel="noopener noreferrer">${nowPlaying.artist}</a>`;

      // Progress bar
      const percent = nowPlaying.timeTotal ? (nowPlaying.timePlayed / nowPlaying.timeTotal) * 100 : 0;
      if (progressBar) progressBar.style.width = percent + '%';

      // Time display
      if (timeStart) timeStart.textContent = `${pad(minutesPlayed)}:${pad(secondsPlayed)}`;
      if (timeEnd) timeEnd.textContent = `${pad(minutesTotal)}:${pad(secondsTotal)}`;

      // Make album cover and title clickable
      if (songUrl) {
        albumImage.onclick = () => window.open(songUrl, '_blank');
        titleEl.onclick = () => window.open(songUrl, '_blank');
      }

      // Show the card
      if (cardElement) cardElement.style.visibility = 'visible';
    };

    // Only set src if different to ensure onload fires
    if (albumImage.src !== albumImageUrl) {
      albumImage.src = albumImageUrl;
    } else if (albumImage.complete && albumImage.naturalHeight !== 0) {
      // If already loaded, manually trigger onload
      albumImage.onload();
    }
  } else {
    // Only show the placeholder if there is no song playing
    albumImage.src = './images/albumCover.png';
    titleEl.textContent = 'No song playing';
    artistEl.textContent = '';
    if (progressBar) progressBar.style.width = '0%';
    if (timeStart) timeStart.textContent = '00:00';
    if (timeEnd) timeEnd.textContent = '00:00';
    if (cardElement) {
      cardElement.style.setProperty('--nowplaying-primary', '#e94f7c');
      cardElement.style.setProperty('--nowplaying-dull', '#bdb6c7');
      cardElement.style.visibility = 'visible';
    }
    albumImage.onclick = null;
    titleEl.onclick = null;
  }
}

// Refresh data every second
async function refreshNowPlaying() {
  const nowPlaying = await getNowPlaying();
  updateUI(nowPlaying);
}

window.onload = () => {
  refreshNowPlaying();
  setInterval(refreshNowPlaying, 1000);
};