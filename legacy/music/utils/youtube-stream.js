const { spawn } = require('child_process');
const https = require('https');

/**
 * Universal audio resolver using yt-dlp
 * Supports: YouTube, SoundCloud, Bandcamp, and many others
 */

// Cache for resolved short URLs
const urlCache = new Map();

/**
 * Resolve on.soundcloud.com short URLs to full URLs
 * Uses curl command which handles redirects properly
 * @param {string} url
 * @returns {Promise<string>}
 */
async function resolveShortUrl(url) {
    if (urlCache.has(url)) {
        return urlCache.get(url);
    }
    
    // Check if it's a short URL
    if (url.includes('on.soundcloud.com')) {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`curl -sI "${url}" | grep -i location | head -1`, (error, stdout) => {
                if (error || !stdout) {
                    resolve(url);
                    return;
                }
                // Parse location header
                const match = stdout.match(/location:\s*(.+)/i);
                if (match && match[1]) {
                    const resolved = match[1].trim();
                    urlCache.set(url, resolved);
                    resolve(resolved);
                } else {
                    resolve(url);
                }
            });
        });
    }
    
    return url;
}

/**
 * Check if query is a URL
 * @param {string} query
 * @returns {boolean}
 */
function isUrl(query) {
    return query.startsWith('http://') || query.startsWith('https://');
}

/**
 * Search for audio (works with search terms or URLs)
 * @param {string} query - Search term or URL
 * @param {object} options
 * @returns {Promise<Array>}
 */
async function search(query, options = { limit: 1 }) {
    // Resolve short URLs first
    const resolvedQuery = await resolveShortUrl(query);
    
    // If it's a URL, get info directly
    if (isUrl(resolvedQuery)) {
        try {
            const info = await getInfo(resolvedQuery);
            return [info];
        } catch (err) {
            console.error('URL info error:', err.message);
            return [];
        }
    }
    
    // Search using yt-dlp
    return new Promise((resolve, reject) => {
        const args = [
            'ytsearch' + (options.limit || 1) + ':' + resolvedQuery,
            '--dump-json',
            '--flat-playlist',
            '--no-warnings',
            '--no-check-certificates',
            '--extractor-args', 'youtube:player_skip=webpage,configs,js',
            '-f', 'bestaudio/best'
        ];
        
        const ytdlp = spawn('yt-dlp', args);
        let output = '';
        let errorOutput = '';
        
        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ytdlp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        ytdlp.on('close', (code) => {
            if (code !== 0 && !output) {
                console.error('yt-dlp search error:', errorOutput);
                resolve([]);
                return;
            }
            
            try {
                const lines = output.trim().split('\n').filter(line => line.trim());
                const results = lines.map(line => {
                    const data = JSON.parse(line);
                    return {
                        title: data.title,
                        url: data.webpage_url || data.url,
                        durationRaw: formatDuration(data.duration),
                        duration: data.duration,
                        id: data.id,
                        channel: data.channel || data.uploader,
                        extractor: data.extractor
                    };
                });
                resolve(results);
            } catch (err) {
                console.error('Parse error:', err.message);
                resolve([]);
            }
        });
    });
}

/**
 * Get info from URL
 * @param {string} url
 * @returns {Promise<object>}
 */
async function getInfo(url) {
    const resolvedUrl = await resolveShortUrl(url);
    
    return new Promise((resolve, reject) => {
        const args = [
            resolvedUrl,
            '--dump-json',
            '--no-warnings',
            '--no-check-certificates',
            '--extractor-args', 'youtube:player_skip=webpage,configs,js'
        ];
        
        const ytdlp = spawn('yt-dlp', args);
        let output = '';
        let errorOutput = '';
        
        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ytdlp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        ytdlp.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp info error:', errorOutput);
                reject(new Error('Failed to get info'));
                return;
            }
            
            try {
                const data = JSON.parse(output.trim().split('\n')[0]);
                resolve({
                    title: data.title,
                    url: resolvedUrl,
                    durationRaw: formatDuration(data.duration),
                    duration: data.duration,
                    id: data.id,
                    channel: data.channel || data.uploader,
                    extractor: data.extractor
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}

/**
 * Get audio stream
 * @param {string} url
 * @returns {Promise<object>}
 */
async function stream(url) {
    const resolvedUrl = await resolveShortUrl(url);
    
    return new Promise((resolve, reject) => {
        // Use specific format selection for better compatibility
        const args = [
            resolvedUrl,
            '-f', 'http_mp3_0_0/bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio/best',
            '-o', '-',
            '--no-warnings',
            '--no-check-certificates',
            '--quiet',
            '--extractor-args', 'youtube:player_skip=webpage,configs,js'
        ];
        
        const ytdlp = spawn('yt-dlp', args);
        let errorOutput = '';
        
        ytdlp.on('error', (err) => {
            reject(new Error('Failed to spawn: ' + err.message));
        });
        
        ytdlp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        // Check for errors after a short delay
        setTimeout(() => {
            if (ytdlp.exitCode !== null && ytdlp.exitCode !== 0) {
                console.error('yt-dlp stream error:', errorOutput);
                reject(new Error('Stream failed'));
                return;
            }
            
            // Return stream with proper type for discord.js
            // StreamType.Raw is best for mp3 audio from yt-dlp
            resolve({
                stream: ytdlp.stdout,
                type: 'raw',
                kill: () => ytdlp.kill()
            });
        }, 1000);
    });
}

/**
 * Format duration
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    search,
    stream,
    isUrl,
    getInfo,
    resolveShortUrl
};
