module.exports={
    name: 'join',
    description: "testing welcome command!",
    execute(message, args){
        console.log(args)
        if(message.member.roles.cache.some(r => r.name === "Admin")){
            console.log("DEBUG: if statement works")
            client.emit("guildMemberAdd", message.member);
        }
    }
}