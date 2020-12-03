module.exports={
    name: 'join',
    description: "testing welcome command!",
    execute(message, args){
        client.emit("guildMemberAdd", message.member);
    }
}