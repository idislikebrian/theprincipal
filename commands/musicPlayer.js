const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const spdl = require('spdl-core');

spdl.setCredentials(process.env.spotify_cliendID, process.env.spotify_clientSecret)

const queue = new Map();

module.exports={
    name: 'musicPlayer',
    description: "Helps you play music together",
    async execute(message, args) {
        if (message.channel.id != "810356148523106327") {
            message.delete();
            return message.channel.send(`You need to be in <#810356148523106327> channel`);
        }
        console.log(args);
        const voiceChannel = message.member.voice.channel;
    
        if (!voiceChannel) {
            return message.channel.send('Please join a voice channel first');
        }
    
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('I need the permissions to join and speak in your voice channel!');
        }
    
        const serverQueue = queue.get(message.guild.id);
    
        if (!args.length) {
            return message.channel.send('You need to tell me what song you want to play, br0.');
        }
    
        let song = {};
        if (ytdl.validateURL(args[0])) {
            const songInfo = await ytdl.getBasicInfo(args[0]);
            song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };
        } else {
            const videoFinder = async (query) => {
                const videoResult = await ytSearch(query);
                return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
            };
            const video = await videoFinder(args.join(' '));
            if (video) {
                song = { title: video.title, url: video.url };
            } else {
                return message.channel.send('Error finding that song.');
            }
        }
    
        if (!serverQueue) {
            const queueConstructor = {
                voiceChannel: voiceChannel,
                textChannel: message.channel,
                connection: null,
                songs: [],
                dispatcher: null,
            };
    
            queue.set(message.guild.id, queueConstructor);
            queueConstructor.songs.push(song);
    
            try {
                const connection = await voiceChannel.join();
                queueConstructor.connection = connection;
                juke(message.guild, queueConstructor.songs[0]);
            } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send('There was an error connecting to the voice channel!');
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(`✅ **${song.title}** has been added to the queue!`);
        }
    }
    
};

async function juke(guild, song) {
    const songQueue = queue.get(guild.id);
  
    if (!song) {
      songQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const stream = ytdl(song.url, { filter: 'audioonly' });
    const dispatcher = songQueue.connection
      .play(stream, { seek: 0, volume: 0.5 })
      .on('finish', () => {
        songQueue.songs.shift();
        juke(guild, songQueue.songs[0]);
      });
  
    songQueue.dispatcher = dispatcher;
    await songQueue.textChannel.send(`🎶 Now Playing: ${song.title}`);
  }
