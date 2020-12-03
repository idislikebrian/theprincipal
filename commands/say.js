const { Client, MessageEmbed, MessageReaction } = require('discord.js');
const bot = new Client();
const Discord = require("discord.js");

module.exports={
    name: 'say',
    description: "Sends a message that was inputted to a channel.",
    execute(message, args){
        console.log(args)
        if(message.member.roles.cache.some(r => r.name === "Admin")){
            if (args.length==0){
                const Embed = new Discord.MessageEmbed()
                    .setColor(0xFFC300)
                    .setTitle("Looking to make an announcement?")
                    .setDescription("Type *~say {your announcement goes here}* send an announcement");
                
                message.channel.send(Embed);
                
                } else { 
                let msgArgs = args.slice(0).join(" ");
                
                const EmbedAnnounce = new Discord.MessageEmbed()
                    .setColor(0xFF0000)
                    .setTitle("❗ ANNOUNCEMENT ❗")
                    .setDescription(msgArgs)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL)
                    .setTimestamp();
                    
                message.channel.send(EmbedAnnounce).then(MessageReaction => {
                    message.delete({ timeout: 1500, reason: 'It had to be done.' });
                } )
            }
        } else {
            return message.channel.send("You're not allowed to use this command. I'm sorry!")
        }

    }
}

// this is a comment to update this code //