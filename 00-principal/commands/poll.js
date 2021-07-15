const Discord = require('discord.js');

module.exports={
    name: 'poll',
    description: "This is a poll command.",
    execute(message, args){
        console.log(args)
        if (args.length==0){
            const Embed = new Discord.MessageEmbed()
                .setColor(0xFFC300)
                .setTitle("Looking to make a poll?")
                .setDescription("Type *~poll {your question goes here}* to initiate a simple yes or no poll");
            message.channel.send(Embed);

            } else { 
            let msgArgs = args.slice(0).join(" ");

            message.channel.send("📋 " + "**" + msgArgs + "**").then(MessageReaction => {
                MessageReaction.react("👍");
                MessageReaction.react("👎");
                message.delete({ timeout: 3500, reason: 'It had to be done.' });
            } )
        }
    }
}