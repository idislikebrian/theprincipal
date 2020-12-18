const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');

module.exports={
    name: 'musicPlayer',
    description: "Helps you play some tunes",
    async execute (message, args){
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel) {
            const connection = await voiceChannel.join();
            if (connection) {
                const dispatcher = connection.play(ytdl(message.content, { format: 'audio' }));
                const songInfo = await ytdl.getBasicInfo(message.content);
                const musicEmbed = new MessageEmbed()
                    .setTitle('Music Player')
                    .setImage(`${songInfo.videoDetails.thumbnail.thumbnails[0].url}`)
                    .setFooter(`${songInfo.videoDetails.title}`)
                    .setColor('BLUE');

                const sentMusicEmbed = await message.channel.send(musicEmbed);
                sentMusicEmbed.react('⏹️');
                sentMusicEmbed.react('⏸️');

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
                        connection.disconnect();
                        sentMusicEmbed.delete();
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