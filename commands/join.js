module.exports={
    name: 'join',
    description: "testing welcome command!",
    execute(message, args, client){
        if(message.member.roles.cache.some(r => r.name === "Admin")){
            client.emit("guildMemberAdd", message.member);
        }
    }
}