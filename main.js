const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['GUILD_MEMBER'] });

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
    const welcomeEmbed = new Discord.MessageEmbed()
    console.log("DEBUG: choosing a random phrase")
    welcomeEmbed.setColor('#5cf000')
    welcomeEmbed.setTitle(randomMessage + '(number ' + member.guild.memberCount)
    welcomeEmbed.setImage('https://cdn.mos.cms.futurecdn.net/93GAa4wm3z4HbenzLbxWeQ-650-80.jpg.webp')
    console.log("DEBUG: creating the embed")
    console.log(member.guild.channels.cache.find(i => i.name === '🧪・testing'));
    member.guild.channels.cache.find(i => i.name === '🧪・testing').send(welcomeEmbed) // replace with actual welcome channelid
    console.log("DEBUG: finding right channel")
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
});

client.login(process.env.token);
