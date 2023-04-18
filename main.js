const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['GUILD_MEMBER'] });

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(port, () => {
  console.log(`Bot web server listening at http://localhost:${port}`);
});

const prefix = '~';

const fs = require('fs');

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('The Principal is online!');
    client.user.setActivity('YouTube', { type: 'WATCHING' });
});

client.on('guildMemberAdd', member => {
    const inTheHouse = [`${member.user.username}, I choose you!`, `Silence fools! Bow! Lord ${member.user.username} is here!`, `${member.user.username}, reporting for duty!`, `Everyone make some noise! ${member.user.username} is here!`, `${member.user.username}'s adventure is about to begin.`, `${member.user.username} comes in peace.`, `Knock-knock. ${member.user.username} is here!`]
    const randomMessage = inTheHouse[Math.floor(Math.random() * inTheHouse.length)]
    const handshakes = [`https://media.tenor.com/images/180cdc8c0939a00e3674e7eeaf9056a3/tenor.gif`, `https://media.tenor.com/images/67e822adc41a34c44c66b998109cd92b/tenor.gif`, `https://media1.tenor.com/images/44830011193e0398e7464ed9a86a3643/tenor.gif`, `https://media.tenor.com/images/08469d2b5bfbe6cfbdea49dd40ae6a08/tenor.gif`, `https://media.tenor.com/images/fc9526c4dc48bce72a0639b29711d59c/tenor.gif`, `https://media0.giphy.com/media/l1IYhmLyuCfgPL16g/giphy.gif`, `https://media1.tenor.com/images/99af662eae886bacc009163ba3150168/tenor.gif?itemid=3846347`, `https://media1.tenor.com/images/73b5c90fc5d2400300292ea8027225c2/tenor.gif?itemid=3400269`]
    const randomHandshake = handshakes[Math.floor(Math.random() * handshakes.length)]
    const welcomeEmbed = new Discord.MessageEmbed()
        .setTitle("🚨 New Member Alert! 🚨")
        .setColor('#5cf000')
        .setDescription(randomMessage)
        .setImage(randomHandshake)
    member.guild.channels.cache.find(i => i.name === '🎉・new-members').send(welcomeEmbed) // replace with actual welcome channelid
})

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        client.commands.get('ping').execute(message, args);

    };
    if (command === 'poll'){
        client.commands.get('poll').execute(message, args);
        
    }
    if (command === 'say'){
        client.commands.get('say').execute(message, args);
        
    }
    if (command === 'music'){
        client.commands.get('musicPlayer').execute(message, args);
        
    }
    if (command === 'join'){
        client.commands.get('join').execute(message, args, client);
        
    }
    if (command === 'purge'){
        client.commands.get('purge').execute(message, args, client);
        
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);