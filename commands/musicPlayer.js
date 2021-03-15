const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const spdl = require('spdl-core');

spdl.setCredentials(process.env.spotify_cliendID, process.env.spotify_clientSecret)

const queue = new Map();

module.exports={
    name: 'musicPlayer',
    description: "Helps you play music together",
    async execute (message, args){
        if(message.channel != "810356148523106327"){
            message.delete()
            return message.channel.send(`You need to be in <#810356148523106327> channel`)
        }
        console.log(args)
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel) {
            const connection = await voiceChannel.join();
            if (connection) {
                const serverQueue = queue.get(message.guild.id);                
                
                if (!args.length) return message.channel.send('You need to tell me what song you want to play, br0.');
                let song = {};
                // searching for music via ytdl
                if (ytdl.validateURL(args[0])) {
                    const songInfo = await ytdl.getBasicInfo(args[0]);
                    song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url }
                } else {
                    // if the video is not a URL then use keywords to find a video
                    const videoFinder = async (query) =>{
                        const videoResult = await ytSearch(query);
                        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
                    }
                    const video = await videoFinder(args.join(' '));
                    if(video){
                        song = { title: video.title, url: video.url }
                    } else {
                    message.channel.send('Error finding that song.');
                    }
                } 
                const dispatcher = connection.play(ytdl(song.url, { format: 'audioonly' }));
                const songInfo = await ytdl.getBasicInfo(song.url);
                const musicEmbed = new MessageEmbed()
                    .setTitle('📻 Jukebox')
                    .setImage(`${songInfo.videoDetails.thumbnails[0].url}`)
                    .setDescription(`**Now Playing:** ${songInfo.videoDetails.title}`)
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
                        reaction.remove();
                        sentMusicEmbed.react('⏸️');
                    } else if (reaction.emoji.name === '⏹️') {
                        connection.disconnect();
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
} 
*/