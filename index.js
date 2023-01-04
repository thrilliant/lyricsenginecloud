const { getLyrics} = require("genius-lyrics-api");
const fs = require('fs');
const http = require('https');
const https = require('http');
const express = require('express');
var request = require('request');
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
		url: `https://api.genius.com/search?q=${encodeURIComponent(data)}`,
		headers: {
			'Authorization': "Bearer 3VvOfkzd_IS9pppAgBxHJp-haHJ0N3QoxGwU-I8yvtbqhRRPmedlnIRQe6e2Xd8-",
		},
	};

	const geniusReq = request(options, (err, res, body) => {
			console.log(err, res, body);
			if (res.statusCode !== 200) {
				console.error(`Error sending request to Genius lyrics API: status code ${res.statusCode}`);
				respo.json({ error: "Error request to Genius lyrics API!!"});
				return;
			}
			// Parse the API response as JSON

			const json = JSON.parse(body);

			// Get the first song from the API response

			if(json.response.hits[0] === undefined)
			{
				respo.json({ error: "song not found!!"});
				return;
			}
       		
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
					url: 'https://itunes.apple.com/search?term=' + encodeURIComponent(title + ' ' + artist) + '&entity=song',
					headers: {
						'Content-Type': 'application/json',
					},
				};
				console.log(iTunesOptions)
			    request.get(iTunesOptions, (err, res, body) => {
					var coverArtUrl_itune ='';

					if (res.statusCode !== 200) {
						console.error(`Error sending request to iTunes Search API: status code ${res.statusCode}`);
						// res.json({ status: 500, message: 'Error sending request to  iTunes Search API'})
						// return;
						coverArtUrl_itune = '';
					}
					// Get the cover art URL for the first result
					else
					{
						body = JSON.parse(body)
						if (body.results.length > 0) {
							coverArtUrl_itune = body.results[0].artworkUrl100;
						} else {
							coverArtUrl_itune = '';
						}
					// Get the cover art URL for the first result
					}

					// If the iTunes Search API did not return a cover art URL, use the Last.fm API as a backup

					const options = {
						url: 'https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=8ca5d3c9bc49e29119b797422f9c9867&artist=' + encodeURIComponent(artist) + '&track=' + encodeURIComponent(title) + '&format=json',
					};

					const req = request(options, (err, res, body) => {

						if (res.statusCode !== 200) {
								console.error(`Error sending request to Last.fm API: status code ${res.statusCode}`);
								res.json({ status: 500, message: 'Error sending request to Last.fm API'})
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
	});
});

// Start the server
app.listen(port, () => {
	console.log(`Listening on ${port}`);
});
