const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    NoSubscriberBehavior,
    getVoiceConnection
} = require('@discordjs/voice');
const play = require('play-dl');

const queue = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Music player commands')
        .addSubcommand(sub =>
            sub.setName('play')
                .setDescription('Play a song from YouTube or Spotify')
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
            
            let song = {};
            try {
                const searchResults = await play.search(query, { limit: 1 });
                if (searchResults.length === 0) return interaction.editReply('No results found.');
                song = {
                    title: searchResults[0].title,
                    url: searchResults[0].url,
                    duration: searchResults[0].durationRaw
                };
            } catch (err) {
                console.error(err);
                return interaction.editReply('Error searching for that song.');
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
                    connection.subscribe(queueContruct.player);

                    playSong(guildId, queueContruct.songs[0]);
                    await interaction.editReply(`🎶 Started playing: **${song.title}**`);
                } catch (err) {
                    console.error(err);
                    queue.delete(guildId);
                    return interaction.editReply('Could not join voice channel.');
                }
            } else {
                serverQueue.songs.push(song);
                return interaction.editReply(`✅ **${song.title}** added to queue!`);
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

async function playSong(guildId, song) {
    const serverQueue = queue.get(guildId);
    if (!song) {
        setTimeout(() => {
            const conn = getVoiceConnection(guildId);
            if (conn) conn.destroy();
            queue.delete(guildId);
        }, 300000); // Leave after 5 mins of inactivity
        return;
    }

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        serverQueue.player.play(resource);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            playSong(guildId, serverQueue.songs[0]);
        });
    } catch (err) {
        console.error(err);
        serverQueue.songs.shift();
        playSong(guildId, serverQueue.songs[0]);
    }
}
