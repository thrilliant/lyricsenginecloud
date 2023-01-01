const fs = require('fs');
const http = require('http');
const express = require('express');

const app = express();

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
			'Authorization': `9kOFXOZZ_Jhs0ncyetUKfFh8V8jN_uArg36jT47RduIS4Lf1aPtuCwrVLwtpCzEF`,
		},
	};
	console.log(options)
	const geniusReq = http.get(options, (res) => {
		let body = '';
		res.on('data', (chunk) => {
			body += chunk;
		});

		// console.log(res)
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
			let lyrics = json.response.song.lyrics;


			// Send a request to the iTunes Search API to get the cover art for the song
			const iTunesOptions = {
				hostname: 'itunes.apple.com',
				path: '/search?term=' + encodeURIComponent(title + ' ' + artist) + '&entity=song',
				headers: {
					'Content-Type': 'application/json',
				},
			};

			const req = http.get(iTunesOptions, (res) => {
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
					coverArtUrl = JSON.parse(body).results[0].artworkUrl100;

					// If the iTunes Search API did not return a cover art URL, use the Last.fm API as a backup
					if (!coverArtUrl) {
						const options = {
							hostname: 'ws.audioscrobbler.com',
							path: '/2.0/?method=track.getInfo&api_key=8ca5d3c9bc49e29119b797422f9c9867&artist=' + encodeURIComponent(artist) + '&track=' + encodeURIComponent(title) + '&format=json',
						};


						const req = http.get(options, (res) => {
							let body = '';
							res.on('data', (chunk) => {
								body += chunk;
							});
							res.on('end', () => {
								if (res.statusCode !== 200) {
									console.error(`Error sending request to Last.fm API: status code ${res.statusCode}`);
									return;
								}
								// Get the cover art URL from the Last.fm API response
								coverArtUrl = JSON.parse(body).track.album.image[3]['#text'];
							});
						});
					} else {
						coverArtUrl = JSON.parse(body).track.album.image[3]['#text'];
					}
					app.get('/', (req, res) => {
						res.send( `<h1>${title}</h1> <p>by ${artist}</p> <img src="${coverArtUrl}" alt="Cover art for ${title}"> <pre>${lyrics}</pre>` );
					});

					app.listen(3000, () => {
						console.log('Server listening on port 3000');
					});

				});
			});

		} );
		// Render the page with the song information and cover art
	});
});
