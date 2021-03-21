module.exports = async (client) =>{
    const guild = client.guilds.cache.get('708336363296260178');
    setInterval(() =>{
        const memberCount = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const memChannel = guild.channels.cache.get('821155178400710686');
        const botChannel = guild.channels.cache.get('823031021582155797');
        memChannel.setName(`👥 Member Count: ${memberCount.toLocaleString()}`)
        botChannel.setName(`🤖 Bot Count: ${botCount.toLocaleString()}`)
        console.log('Updating Member Count');
    }, 60000);
}