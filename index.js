const fs = require('fs');
const http = require('http');
const express = require('express');

const app = express();

// Read the contents of the "nowplaying.txt" file
fs.readFile('./nowplaying.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading "nowplaying.txt": ${err.message}`);
    return;
  }

  // Send a request to the Genius lyrics API with the contents of the "nowplaying.txt" file
  const options = {
    hostname: 'api.genius.com',
    path: `/search?q=${encodeURIComponent(data)}`,
    headers: {
      'Authorization': `Bearer YOUR_ACCESS_TOKEN`,
    },
  };

  const req = http.get(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`Error sending request to Genius lyrics API: status code ${res.statusCode}`);
        return;
      }

      // Parse the API response as JSON
      const json = JSON.parse(body);

      // Get the first song from the API response
      const song = json.response.hits[0].result;

      // Get the song title and artist
      const title = song.title;
      const artist = song.primary_artist.name;

      // Get the lyrics for the song
      const lyrics = json.response.song.lyrics;

      // Send a request to the iTunes Search API to get the cover art for the song
      const options = {
        hostname: 'itunes.apple.com',
        path: `/search?term=${encodeURIComponent(`${title} ${artist}`)}&entity=song`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.get(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error(`Error sending request to iTunes Search API: status code ${res.statusCode}`);
            return;
          }

          // Get the cover art URL for the first result
          let coverArtUrl = JSON.parse(body).results[0].artworkUrl100;

          // If the iTunes Search API did not return a cover art URL, use the Last.fm API as a backup
          if (!coverArtUrl) {
            const options = {
  hostname: 'ws.audioscrobbler.com',
  path: `/2.0/?method=track.getInfo&api_key=YOUR_LAST_FM_API_KEY&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`,
};
    url: `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=YOUR_LAST_FM_API_KEY&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`,
    json: true,
  }, (error, response, body) => {
    if (error) {
      console.error(`Error sending request to Last.fm API: ${error.message}`);
      return;
    }

    // Get the cover art URL from the Last.fm API response
    coverArtUrl = body.track.album.image[3]['#text'];
  });
}

// Set up an endpoint to display the song title, artist, cover art, and lyrics
app.get('/lyrics', (req, res) => {
  res.send(`
    <h1>${title}</h1>
    <h2>by ${artist}</h2>
    <img src="${coverArtUrl}" alt="Cover art for ${title}">
    <pre>${lyrics}</pre>
  `);
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
