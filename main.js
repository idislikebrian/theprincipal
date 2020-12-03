const Discord = require('discord.js');

const client = new Discord.Client();

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
});

//Welcome message\\
client.on('guildMemberAdd', member => {
    const inTheHouse = ["{}, I choose you!", "Silence fools! Bow! Lord {} is here!", "{}, reporting for duty!", "Everyone make some noise! {} is here!", "{}'s adventure is about to begin.", "{} comes in peace.", "Knock-knock. {} is here!"]
    const randomMessage = inTheHouse[Math.floor(Math.random() * inTheHouse.length)]
    const welcomeEmbed = new Discord.MessageEmbed()

    welcomeEmbed.setColor('#5cf000')
    welcomeEmbed.setTitle('**' + member.user.username + randomMessage + member.guild.memberCount + '** people')
    welcomeEmbed.setImage('https://cdn.mos.cms.futurecdn.net/93GAa4wm3z4HbenzLbxWeQ-650-80.jpg.webp')

    member.guild.channels.get('740979557133320312').send(welcomeEmbed) // replace with actual welcome
})
//Welcome messages\\

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
});

client.login(process.env.token);
