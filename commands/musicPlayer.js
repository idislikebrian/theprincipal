const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');

const queue = new Map();

module.exports={
    name: 'musicPlayer',
    description: "Helps you play music together",
    async execute (message, args){
        console.log(args)
        const serverQueue = queue.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel) {
            const connection = await voiceChannel.join();
            if (!args.length) return message.channel.send('You need to send a link to a YouTube video as well.');
            let song = {};
            if (connection) {
                const dispatcher = connection.play(ytdl(message.content, { format: 'audio' }));
                const songInfo = await ytdl.getBasicInfo(message.content);
                const musicEmbed = new MessageEmbed()
                    .setTitle('📻 Jukebox')
                    .setImage(`${songInfo.videoDetails.thumbnail.thumbnails[0].url}`)
                    .setFooter(`**Now Playing:** ${songInfo.videoDetails.title}`)
                    .setTimestamp()
                    .setColor('BLUE');

                const sentMusicEmbed = await message.channel.send(musicEmbed);
                sentMusicEmbed.react('⏹️');
                sentMusicEmbed.react('⏸️');
                sentMusicEmbed.react('⏭');

                let filter = (reaction, user) => !user.bot && user.id === message.author.id;
                const reactionCollector = sentMusicEmbed.createReactionCollector(filter);

                reactionCollector.on('collect', (reaction) => {
                    if (reaction.emoji.name === '⏸️') {
                        dispatcher.pause();
                        reaction.remove();
                        sentMusicEmbed.react('▶️');
                    } else if (reaction.emoji.name === '▶️') {
                        dispatcher.resume();
                        reaction.remove();
                        sentMusicEmbed.react('⏸️');
                    } else if (reaction.emoji.name === '⏹️') {
                        if (!message.member.voice.channel) return message.channel.send('You need to be in the voice channel where this music is playing to have a say.');
                        serverQueue.songs = [];
                        serverQueue.connection.disconnect();
                        sentMusicEmbed.delete();
                    } else if (reaction.emoji.name == '⏭') {
                        if (!message.member.voice.channel) return message.channel.send('You need to be in the voice channel where this music is playing to have a say.');
                        if (!serverQueue){
                            return message.channel.send(`There are no songs in the queue 😔`);
                        }
                        serverQueue.connection.dispatcher.end();
                    } else {
                        reaction.remove();
                    }
                });

                dispatcher.on('finish', () => {
                    connection.disconnect();
                    sentMusicEmbed.delete();
                });
            }
        } else {
            message.channel.send('Please join a voice channel first');
        }
    }
};
/* working on dispatcher WIP WIP WIP WIP WIP
const juke = async (guild, song) => {
    const songQueue = queue.get(guild.id);

    if (!song) {
        songQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, {filter: 'audioonly' });
    songQueue.connection.play(stream, { seek: 0, volume: 0.5})
    .on('finish', () => {
        songQueue.songs.shift();
        juke(guild, songQueue.songs[0]);
    });
    await songQueue.text_channel.send(`🎶 Now Playing`)
} */