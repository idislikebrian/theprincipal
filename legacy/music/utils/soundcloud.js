const https = require('https');
const { spawn } = require('child_process');

/**
 * SoundCloud resolver for Discord music bot
 * Uses SoundCloud's internal API (no auth required for public tracks)
 */

let clientId = null;

/**
 * Get or refresh SoundCloud client_id
 * @returns {Promise<string>}
 */
async function getClientId() {
    if (clientId) return clientId;
    
    // Try to fetch from SoundCloud's JS assets
    return new Promise((resolve, reject) => {
        https.get('https://a-v2.sndcdn.com/assets/49-a8a52c8e.js', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Look for 32-char client_id in the JS
                const matches = data.match(/[a-zA-Z0-9]{32}/);
                if (matches && matches[0]) {
                    clientId = matches[0];
                    resolve(clientId);
                } else {
                    // Fallback to a known working client_id
                    clientId = 'S6tkT3c0T13g9z33Qz0tG70b61FpzXkS';
                    resolve(clientId);
                }
            });
        }).on('error', () => {
            // Fallback on error
            clientId = 'S6tkT3c0T13g9z33Qz0tG70b61FpzXkS';
            resolve(clientId);
        });
    });
}

/**
 * Check if query is a SoundCloud URL
 * @param {string} query
 * @returns {boolean}
 */
function isSoundCloudUrl(query) {
    return query.includes('soundcloud.com');
}

/**
 * Search SoundCloud
 * @param {string} query - Search term or URL
 * @param {object} options
 * @returns {Promise<Array>}
 */
async function search(query, options = { limit: 1 }) {
    if (isSoundCloudUrl(query)) {
        try {
            const track = await getTrackInfo(query);
            return [track];
        } catch (err) {
            console.error('SoundCloud URL error:', err.message);
            return [];
        }
    }
    
    try {
        const cid = await getClientId();
        const limit = options.limit || 1;
        
        return new Promise((resolve, reject) => {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodedQuery}&client_id=${cid}&limit=${limit}`;
            
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (!json.collection || json.collection.length === 0) {
                            resolve([]);
                            return;
                        }
                        
                        const results = json.collection.map(track => ({
                            title: track.title,
                            artist: track.user?.username || 'Unknown',
                            url: track.permalink_url,
                            duration: Math.floor(track.duration / 1000),
                            durationRaw: formatDuration(Math.floor(track.duration / 1000)),
                            id: track.id.toString(),
                            artwork: track.artwork_url?.replace('large', 't500x500') || null,
                            streamUrl: track.media?.transcodings?.[0]?.url || null
                        }));
                        
                        resolve(results);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
    } catch (err) {
        console.error('SoundCloud search error:', err.message);
        return [];
    }
}

/**
 * Get track info from SoundCloud URL
 * @param {string} url
 * @returns {Promise<object>}
 */
async function getTrackInfo(url) {
    const cid = await getClientId();
    
    // Resolve URL to track info
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${cid}`;
    
    return new Promise((resolve, reject) => {
        https.get(resolveUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const track = JSON.parse(data);
                    if (track.errors) {
                        reject(new Error('Track not found'));
                        return;
                    }
                    
                    resolve({
                        title: track.title,
                        artist: track.user?.username || 'Unknown',
                        url: track.permalink_url,
                        duration: Math.floor(track.duration / 1000),
                        durationRaw: formatDuration(Math.floor(track.duration / 1000)),
                        id: track.id.toString(),
                        artwork: track.artwork_url?.replace('large', 't500x500') || null,
                        streamUrl: track.media?.transcodings?.find(t => t.format.protocol === 'progressive')?.url || 
                                  track.media?.transcodings?.[0]?.url || null
                    });
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Get audio stream from SoundCloud track
 * @param {object} track
 * @returns {Promise<object>}
 */
async function stream(track) {
    try {
        const cid = await getClientId();
        let streamUrl = track.streamUrl;
        
        // If we only have the track URL, get stream URL first
        if (!streamUrl && track.url) {
            const info = await getTrackInfo(track.url);
            streamUrl = info.streamUrl;
        }
        
        if (!streamUrl) {
            throw new Error('No stream URL available for this track');
        }
        
        // Get the actual stream URL (follow the redirect)
        const actualStreamUrl = await new Promise((resolve, reject) => {
            https.get(`${streamUrl}?client_id=${cid}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.url);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
        
        // Stream using yt-dlp (handles SoundCloud well)
        return new Promise((resolve, reject) => {
            const args = [
                actualStreamUrl,
                '-f', 'bestaudio',
                '-o', '-',
                '--no-warnings',
                '--no-check-certificates',
                '--quiet'
            ];
            
            const ytdlp = spawn('yt-dlp', args);
            
            ytdlp.on('error', (err) => {
                reject(new Error('Failed to spawn stream: ' + err.message));
            });
            
            setTimeout(() => {
                if (ytdlp.exitCode !== null && ytdlp.exitCode !== 0) {
                    reject(new Error('Stream process exited'));
                    return;
                }
                
                resolve({
                    stream: ytdlp.stdout,
                    type: 'mp3',
                    kill: () => ytdlp.kill()
                });
            }, 500);
        });
    } catch (err) {
        console.error('SoundCloud stream error:', err.message);
        throw err;
    }
}

/**
 * Format duration
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    search,
    stream,
    isSoundCloudUrl,
    getTrackInfo
};
