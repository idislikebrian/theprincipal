const { Client, RichEmbed, MessageReaction } = require('discord.js');
const bot = new Client();
const Discord = require("discord.js");

module.exports.config = {
    name: "say",
    description: "sends a message that was inputted to a channel",
    usage: "say",
    accessableby: "Staff"
}

module.exports.run = async (bot, message, args) => {

    if(!message.member.hasPermission(["MANAGE_MESSAGES", "ADMINISTRATOR"])) return message.channel.send("You're not allowed to use this command. I'm sorry!")

    let argsresults; 
    let mChannel = message.mentions.channels.first()
    
    message.delete()
    if(mChannel) {
        argsresults = args.slice(1).join(" ")
        mChannel.send(argsresult)
    } else {

    }
}


