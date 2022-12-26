const fs = require('fs');
const request = require('request');
const express = require('express');

const app = express();

// Read the contents of the "nowplaying.txt" file
fs.readFile('./nowplaying.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading "nowplaying.txt": ${err.message}`);
    return;
  }

  // Send a request to the Genius lyrics API with the contents of the "nowplaying.txt" file
  request.get({
    url: `https://api.genius.com/search?q=${encodeURIComponent(data)}`,
    headers: {
      'Authorization': `jwfNX8M9XHX8pec12_C4LFqCuKXCnxw1UFvLRVuMtsbwsYf5lInHVQALG482_V6hQFKY9w6d1WdsaJV42nhAoA`,
    },
  }, (error, response, body) => {
    if (error) {
      console.error(`Error sending request to Genius lyrics API: ${error.message}`);
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
    request.get({
      url: `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&entity=song`,
      json: true,
    }, (error, response, body) => {
      if (error) {
        console.error(`Error sending request to iTunes Search API: ${error.message}`);
        return;
      }

      // Get the cover art URL for the first result
      const coverArtUrl = body.
results[0].artworkUrl100;

      // Set up an endpoint to display the song title, artist, cover art, and lyrics
      app.get('/lyrics', (req, res) => {
        res.send(`
          <img src="${coverArtUrl}" alt="Cover art for ${title}">
          <h1>${title}</h1>
          <h2>by ${artist}</h2>
          <pre>${lyrics}</pre>
        `);
      });
    });
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
