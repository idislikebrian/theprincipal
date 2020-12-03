const { Client, MessageEmbed, MessageReaction } = require('discord.js');
const bot = new Client();
const Discord = require('discord.js');
const client = new Discord.Client();

module.exports={
    name: 'join',
    description: "testing welcome command!",
    execute(message, args){
        console.log(args)
        if(message.member.roles.cache.some(r => r.name === "Admin")){
            client.emit("guildMemberAdd", message.member);
        }
    }
}