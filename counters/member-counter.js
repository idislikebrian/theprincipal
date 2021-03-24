module.exports = async (client) =>{
    const guild = client.guilds.cache.get('708336363296260178');
    setInterval(() =>{
        const memberCount = guild.members.cache.filter(member => !member.user.bot).size;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const memChannel = guild.channels.cache.get('821155178400710686');
        const botChannel = guild.channels.cache.get('823031021582155797');
        const patrChannel = guild.channels.cache.get('823040693747843092');
        const staffChannel = guild.channels.cache.get('824015124356137060');
        const modChannel = guild.channels.cache.get('824086983491584020')
        let collectorRoleID = '823039147539038209';
        const patronCount = guild.roles.cache.get(collectorRoleID).members.size;
        let facilitatRoleID = '709389579651645502';
        const modCount = guild.roles.cache.get(facilitatRoleID).members.size;
        let atyStaffRoleID = '748232779807981698';
        const staffCount = guild.roles.cache.get(atyStaffRoleID).members.size;
        memChannel.setName(`👥 Members: ${memberCount.toLocaleString()}`)
        botChannel.setName(`🤖 Bots: ${botCount.toLocaleString()}`)
        patrChannel.setName(`💯 Patrons: ${patronCount.toLocaleString()}`)
        staffChannel.setName(`🎨 Staff: ${staffCount.toLocaleString()}`)
        modChannel.setName(`😎 Facilitator: ${modCount.toLocaleString()}`)
        console.log('Updating Member Count');
    }, 60000);
}