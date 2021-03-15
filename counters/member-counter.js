module.exports = async (client) =>{
    const guild = client.guilds.cache.get('708336363296260178');
    setInterval(() =>{
        const memberCount = guild.memberCount;
        const channel = guild.channels.cache.get('821155178400710686');
        channel.setName(`Total Members: ${memberCount.toLocaleString()}`)
        console.log('Updating Member Count');
    }, 5000);
}