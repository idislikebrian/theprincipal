const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Manually trigger the welcome event for testing.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        interaction.client.emit('guildMemberAdd', interaction.member);
        await interaction.reply({ content: 'Welcome event triggered!', ephemeral: true });
    },
};
