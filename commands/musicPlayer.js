const { Client, MessageEmbed, MessageReaction } = require('discord.js');
const bot = new Client();
const Discord = require("discord.js");

const ytdl = require('ytdl-core');

module.exports.execute = async (message) => {
    // remove '!' and 'music' from the message content and get the video url
    let musicLink = message.content.slice(1).split(' ').splice(1).shift();

    let voiceChannel = message.member.voice.channel;

    if (voiceChannel) {
        let urlValidity = ytdl.validateURL(musicLink);
        if (urlValidity) {
            const connection = await voiceChannel.join();
            let dispatcher = connection.play(ytdl(musicLink, { filter: "audio" }));

            let deletedMessage = await message.delete();
            let info = await ytdl.getBasicInfo(musicLink);

            const musicPlayerEmbed = new MessageEmbed()
                .setColor('BLUE')
                .setTitle(info.videoDetails.title)
                .setThumbnail(info.videoDetails.thumbnail.thumbnails[0].url);

            let sentMusicPlayerEmbed = await deletedMessage.channel.send(musicPlayerEmbed);
            sentMusicPlayerEmbed.react('⏹️');
            sentMusicPlayerEmbed.react('⏸️');

            let filter = (reaction, user) => !user.bot && user.id === message.author.id;
            const reactionCollector = sentMusicPlayerEmbed.createReactionCollector(filter);

            reactionCollector.on('collect', (reaction) => {
                if (reaction.emoji.name === '⏸️') {
                    dispatcher.pause();
                    reaction.remove();
                    sentMusicPlayerEmbed.react('▶️');
                } else if (reaction.emoji.name === '▶️') {
                    dispatcher.resume();
                    reaction.remove();
                    sentMusicPlayerEmbed.react('⏸️');
                } else if (reaction.emoji.name === '⏹️') {
                    connection.disconnect();
                    sentMusicPlayerEmbed.delete();
                } else {
                    reaction.remove();
                }

            });

            dispatcher.on('finish', () => {
                connection.disconnect();
                sentMusicPlayerEmbed.delete();
            });

        } else {
            message.delete().then(m => m.channel.send('Provide a valid YouTube link so that I can play some music.'));
        }
    } else {
        message.delete().then(m => m.channel.send('you need to join a voice channel first.'));
    }
}