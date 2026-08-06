const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    NoSubscriberBehavior,
    getVoiceConnection,
    StreamType,
    entersState
} = require('@discordjs/voice');
const audio = require('./utils/youtube-stream');

const queue = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Music player commands')
        .addSubcommand(sub =>
            sub.setName('play')
                .setDescription('Play a song from YouTube, SoundCloud, or search')
                .addStringOption(opt => opt.setName('query').setDescription('Song title or URL').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('skip')
                .setDescription('Skip the current song'))
        .addSubcommand(sub =>
            sub.setName('stop')
                .setDescription('Stop the player and clear queue')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to use music commands!', ephemeral: true });
        }

        let serverQueue = queue.get(guildId);

        if (subcommand === 'play') {
            await interaction.deferReply();
            const query = interaction.options.getString('query');
            
            let song = null;
            
            // Search for the song
            try {
                console.log('[Music] Searching for:', query);
                const results = await audio.search(query, { limit: 1 });
                
                if (results.length === 0) {
                    return interaction.editReply('No results found. Try a direct URL or different search terms.');
                }
                
                song = {
                    title: results[0].title,
                    url: results[0].url,
                    duration: results[0].durationRaw,
                    source: results[0].extractor || 'unknown'
                };
                
            } catch (err) {
                console.error('[Music] Search error:', err);
                return interaction.editReply('Error searching for that song. Try a SoundCloud or Bandcamp URL instead.');
            }

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: interaction.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    songs: [],
                    player: createAudioPlayer({
                        behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
                    }),
                };

                queue.set(guildId, queueContruct);
                queueContruct.songs.push(song);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });

                    queueContruct.connection = connection;
                    
                    // Log connection state changes
                    connection.on('stateChange', (oldState, newState) => {
                        console.log(`[Voice] Connection state: ${oldState.status} -> ${newState.status}`);
                    });
                    
                    // Wait for connection to be ready
                    console.log('[Voice] Waiting for connection to be ready...');
                    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
                    console.log('[Voice] Connection ready!');
                    
                    // Subscribe player to connection
                    const subscription = connection.subscribe(queueContruct.player);
                    console.log('[Voice] Player subscribed:', subscription ? 'YES' : 'NO');
                    
                    // Log player state changes
                    queueContruct.player.on('stateChange', (oldState, newState) => {
                        console.log(`[Player] State: ${oldState.status} -> ${newState.status}`);
                    });
                    
                    queueContruct.player.on('error', (error) => {
                        console.error('[Player] Error:', error.message);
                    });

                    playSong(guildId, queueContruct.songs[0]);
                    const emoji = getSourceEmoji(song.source);
                    await interaction.editReply(`${emoji} Started playing: **${song.title}**`);
                } catch (err) {
                    console.error('[Voice] Connection error:', err);
                    queue.delete(guildId);
                    return interaction.editReply('Could not join voice channel: ' + err.message);
                }
            } else {
                serverQueue.songs.push(song);
                const emoji = getSourceEmoji(song.source);
                return interaction.editReply(`${emoji} **${song.title}** added to queue!`);
            }
        } else if (subcommand === 'skip') {
            if (!serverQueue) return interaction.reply('Nothing to skip.');
            serverQueue.player.stop();
            await interaction.reply('Skipped the song!');
        } else if (subcommand === 'stop') {
            if (!serverQueue) return interaction.reply('Nothing to stop.');
            serverQueue.songs = [];
            serverQueue.player.stop();
            serverQueue.connection.destroy();
            queue.delete(guildId);
            await interaction.reply('Stopped the player and cleared the queue.');
        }
    },
};

function getSourceEmoji(source) {
    if (source.includes('soundcloud')) return '☁️';
    if (source.includes('youtube')) return '🎶';
    if (source.includes('bandcamp')) return '🎸';
    return '🎵';
}

async function playSong(guildId, song) {
    const serverQueue = queue.get(guildId);
    if (!song) {
        setTimeout(() => {
            const conn = getVoiceConnection(guildId);
            if (conn) conn.destroy();
            queue.delete(guildId);
        }, 300000);
        return;
    }

    try {
        console.log('[Music] Streaming from', song.source, ':', song.title);
        console.log('[Music] Current player state:', serverQueue.player.state.status);
        
        const stream = await audio.stream(song.url);
        console.log('[Music] Stream created, type:', stream.type);
        
        // Create audio resource - use Raw for mp3 streams from yt-dlp
        const resource = createAudioResource(stream.stream, { 
            inputType: StreamType.Raw,
            inlineVolume: true 
        });
        
        console.log('[Music] Audio resource created');
        console.log('[Music] Playing...');
        
        serverQueue.player.play(resource);
        
        console.log('[Music] Player state after play:', serverQueue.player.state.status);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            console.log('[Music] Song ended, playing next...');
            serverQueue.songs.shift();
            playSong(guildId, serverQueue.songs[0]);
        });
    } catch (err) {
        console.error('[Music] Playback error:', err);
        serverQueue.textChannel.send(`❌ Error playing **${song.title}**. Skipping...`);
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs[0]);
    }
}
