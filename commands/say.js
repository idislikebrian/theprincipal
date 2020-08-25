const { Client, RichEmbed, MessageReaction } = require('discord.js');
const bot = new Client();
const Discord = require("discord.js");


// module.exports.run = async (bot, message, args) => {

//     if(!message.member.hasPermission(["MANAGE_MESSAGES", "ADMINISTRATOR"])) return message.channel.send("You're not allowed to use this command. I'm sorry!")

//     let argsresults; 
//     let mChannel = message.mentions.channels.first()
    
//     message.delete()
//     if(mChannel) {
//         argsresults = args.slice(1).join(" ")
//         mChannel.send(argsresult)
//     } else {

//     }
// }


module.exports={
    name: 'say',
    description: "Sends a message that was inputter to a channel.",
    execute(message, args){
        console.log(args)
        if (args.length==0){
            const Embed = new Discord.MessageEmbed()
                .setColor(0xFFC300)
                .setTitle("Looking to make an announcement?")
                .setDescription("Type *~say {your announcement goes here}* send an announcement");
               
            message.channel.send(Embed);
            
            } else { 
            let msgArgs = args.slice(0).join(" ");
            
            const EmbedAnnounce = new Discord.MessageEmbed()
                .setColor(0xFFC300)
                .setTitle("❗ ANNOUNCEMENT ❗")
                .setDescription(msgArgs);
                
            message.channel.send(EmbedAnnounce).then(MessageReaction => {
                message.delete({ timeout: 3500, reason: 'It had to be done.' });
            } )
        }
    }
}