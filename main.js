const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Bot web server listening at http://0.0.0.0:${port}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[WARNING] The command at ./commands/${file} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    client.user.setActivity('YouTube', { type: 'WATCHING' });
});

client.on('guildMemberAdd', async member => {
    const inTheHouse = [
        `${member.user.username}, I choose you!`,
        `Silence fools! Bow! Lord ${member.user.username} is here!`,
        `${member.user.username}, reporting for duty!`,
        `Everyone make some noise! ${member.user.username} is here!`,
        `${member.user.username}'s adventure is about to begin.`,
        `${member.user.username} comes in peace.`,
        `Knock-knock. ${member.user.username} is here!`,
    ];
    const randomMessage = inTheHouse[Math.floor(Math.random() * inTheHouse.length)];
    const handshakes = [
        'https://media.tenor.com/images/180cdc8c0939a00e3674e7eeaf9056a3/tenor.gif',
        'https://media.tenor.com/images/67e822adc41a34c44c66b998109cd92b/tenor.gif',
        'https://media1.tenor.com/images/44830011193e0398e7464ed9a86a3643/tenor.gif',
        'https://media.tenor.com/images/08469d2b5bfbe6cfbdea49dd40ae6a08/tenor.gif',
        'https://media.tenor.com/images/fc9526c4dc48bce72a0639b29711d59c/tenor.gif',
        'https://media0.giphy.com/media/l1IYhmLyuCfgPL16g/giphy.gif',
        'https://media1.tenor.com/images/99af662eae886bacc009163ba3150168/tenor.gif?itemid=3846347',
        'https://media1.tenor.com/images/73b5c90fc5d2400300292ea8027225c2/tenor.gif?itemid=3400269',
    ];
    const randomHandshake = handshakes[Math.floor(Math.random() * handshakes.length)];

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🚨 New Member Alert! 🚨')
        .setColor('#5cf000')
        .setDescription(randomMessage)
        .setImage(randomHandshake);

    const channel = member.guild.channels.cache.find(c => c.name === '🎉・new-members');
    if (channel) {
        await channel.send({ embeds: [welcomeEmbed] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
