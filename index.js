const { getLyrics} = require("genius-lyrics-api");
const fs = require('fs');
const http = require('https');
const https = require('http');
const express = require('express');
const port = 4500;
const app = express();


app.get('/', (req, respo) => {
	String.prototype.escapeSpecialChars = function () {
		return this.replace(/\\n/g, " ");
	  };
	  String.prototype.escapedouble = function () {
		return this.replace(/\\"/g, '"');
	  };
// Read the contents of the "nowplaying.txt" file
fs.readFile('./nowplaying.txt', 'utf8', (err, data) => {
	// Handle any errors that may occur while reading the file
	if (err) {
		console.error(`Error reading "nowplaying.txt": ${err.message}`);
		return;
	}

	// Send a request to the Genius lyrics API with the contents of the "nowplaying.txt" file
	const options = {
		hostname: 'api.genius.com',
		path: `/search?q=${encodeURIComponent(data)}`,
		headers: {
			'Authorization': "Bearer Mv4TSk9wcnfezwbbnDvZ12uf9ZPwMS1587yEHahvF5tv7C2mgHxnovs9h3u9Uc2D",
		},
	};

	const geniusReq = http.get(options, (res) => {
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

   if(json.response.hits[0] === undefined)
   {
    respo.json({ error: "song not found!!"});
   }
   else
   {
       const song = json.response.hits[0].result;
			// Get the song title and artist
			const title = song.title;
			const artist = song.primary_artist.name;

			const options = {
				apiKey: 'Mv4TSk9wcnfezwbbnDvZ12uf9ZPwMS1587yEHahvF5tv7C2mgHxnovs9h3u9Uc2D',
				title: title,
				artist: artist,
				optimizeQuery: true
			};
			getLyrics(options).then(function (lyrics) {
				var myJSONString = JSON.stringify(lyrics);
				var myEscapedJSONString = myJSONString.escapeSpecialChars();

			// Get the lyrics for the song
			//const lyrics = json.response.song.lyrics;


			// Send a request to the iTunes Search API to get the cover art for the song
			const iTunesOptions = {
				hostname: 'itunes.apple.com',
				path: '/search?term=' + encodeURIComponent(title + ' ' + artist) + '&entity=song',
				headers: {
					'Content-Type': 'application/json',
				},
			};

			const req = https.get(iTunesOptions, (res) => {
				let body = '';
				res.on('data', (chunk) => {
					body += chunk;
				});
				res.on('end', () => {

					if (res.statusCode !== 200) {
						console.error(`Error sending request to iTunes Search API: status code ${res.statusCode}`);
						return;
					}
                     var coverArtUrl_itune ='';
					// Get the cover art URL for the first result
					if(JSON.parse(body).results[0] === undefined)
										{
											 coverArtUrl_itune = '';
										}
										else
										{
					// Get the cover art URL for the first result
					coverArtUrl_itune = JSON.parse(body).results[0].artworkUrl100;
										}

					// If the iTunes Search API did not return a cover art URL, use the Last.fm API as a backup

						const options = {
							hostname: 'ws.audioscrobbler.com',
							path: '/2.0/?method=track.getInfo&api_key=8ca5d3c9bc49e29119b797422f9c9867&artist=' + encodeURIComponent(artist) + '&track=' + encodeURIComponent(title) + '&format=json',
						};


						const req = https.get(options, (res) => {
							let body = '';
							res.on('data', (chunk) => {
								body += chunk;
							});
							res.on('end', () => {

									if (res.statusCode !== 200) {
											console.error(`Error sending request to Last.fm API: status code ${res.statusCode}`);
											return;
										}

										if(JSON.parse(body).error === 6)
										 {
											coverArtUrl = '';
										 }
										else if(JSON.parse(body).track.album === undefined)
										{
											coverArtUrl = '';
										}
										else
										{
										// Get the cover art URL from the Last.fm API response
										coverArtUrl = JSON.parse(body).track.album.image[3]['#text'];
										}
										respo.json({ song_title: title,coverArtUrl_lastfm:coverArtUrl,lyrics:myEscapedJSONString.escapedouble(),coverArtUrl_itunes:coverArtUrl_itune});
									});
								});



						});
					});

				}); // Render the page with the song information and cover art
   }
			});

});

// Start the server

});
});

app.listen(port, () => {
	console.log(`Listening on ${port}`);
});
